import {
  openFrameStream,
  type FrameStreamConnection,
} from "@/common/api/frameStreamClient";
import {
  requestHealth,
  requestHeartbeat,
  requestRoomFrames,
  requestRoomSnapshot,
} from "@/common/api/roomApi";
import type { Frame, RoomSnapshot } from "@/common/api/roomContract";
import { NetworkRequestError } from "@/common/api/restClient";
import {
  getCandidateInstanceBaseUrls,
  hasMultipleInstanceCandidates,
  persistPreferredInstanceBaseUrl,
  readPreferredInstanceBaseUrl,
} from "@/common/config/instances";
import {
  ingestBackfillPage,
  ingestConfirmedFrame,
  markBackfillFailed,
  markBackfillFinished,
  markBackfillStarted,
  nextBackfillRange,
  resetVersionInbox,
  versionInbox,
  type BackfillRange,
} from "@/common/connection/versionInbox.svelte";
import {
  applyDraftDelta,
  applyDraftInterrupt,
  clearDraft,
  completeDraftGeneration,
} from "@/common/stores/draft.svelte";
import { applyHistorySnapshot } from "@/common/stores/history.svelte";
import { clearIdentity, identity } from "@/common/stores/identity.svelte";
import { metadata } from "@/common/stores/metadata.svelte";

// Connection phases shown by the interface. "loading" and "reconnecting" both
// mean the snapshot is being refetched before the stream reopens.
export type ConnectionPhase =
  | "idle"
  | "loading"
  | "connected"
  | "reconnecting"
  | "offline"
  | "unauthorized"
  | "failed";

export interface RoomConnectionState {
  // Connection phase, never derived from a local clock.
  phase: ConnectionPhase;
  // Room currently attached, empty outside a room route.
  roomIdentifier: string;
  // Instance reported by the service, not guessed from the URL.
  instanceIdentifier: string;
  // Base URL of the instance currently in use.
  instanceBaseUrl: string;
  // Consecutive failed attempts, reset after a successful snapshot.
  attempt: number;
  // Highest confirmed version applied locally.
  lastConfirmedVersion: number;
  // Last English error message, shown verbatim by the interface.
  lastError: string;
}

export const roomConnection = $state<RoomConnectionState>({
  phase: "idle",
  roomIdentifier: "",
  instanceIdentifier: "",
  instanceBaseUrl: "",
  attempt: 0,
  lastConfirmedVersion: 0,
  lastError: "",
});

const RECONNECT_BASE_DELAY_MILLISECONDS = 500;
const RECONNECT_MAX_DELAY_MILLISECONDS = 8000;
const BACKFILL_PAGE_SIZE = 100;
const MAX_BACKFILL_PAGE_COUNT = 50;
const MAX_BACKFILL_RANGE_COUNT = 20;

let activeRoomIdentifier: string = "";
let candidateBaseUrls: string[] = [];
let candidateIndex: number = 0;
let streamConnection: FrameStreamConnection | null = null;
let retryTimerIdentifier: number | null = null;
let attemptController: AbortController | null = null;
let isAttemptRunning: boolean = false;
// Incremented on every reset so late responses from an abandoned attempt are
// discarded instead of overwriting the current state.
let connectionToken: number = 0;

function closeStream(): void {
  streamConnection?.close();
  streamConnection = null;
}

function clearRetryTimer(): void {
  if (retryTimerIdentifier !== null) {
    window.clearTimeout(retryTimerIdentifier);
    retryTimerIdentifier = null;
  }
}

function resetConnection(): void {
  connectionToken += 1;
  clearRetryTimer();
  attemptController?.abort();
  attemptController = null;
  isAttemptRunning = false;
  closeStream();
}

function reconnectDelayMilliseconds(attempt: number): number {
  const delay: number =
    RECONNECT_BASE_DELAY_MILLISECONDS * 2 ** Math.max(attempt - 1, 0);
  return Math.min(delay, RECONNECT_MAX_DELAY_MILLISECONDS);
}

function applySnapshot(snapshot: RoomSnapshot): void {
  applyHistorySnapshot(
    snapshot.records.map((record) => ({
      version: record.version,
      content: record.content,
      authorDisplayName: record.displayName,
    })),
  );
  // The snapshot contains only confirmed records, so the draft layer is empty
  // after every reconnect. Draft text is never restored.
  clearDraft();
  roomConnection.lastConfirmedVersion = snapshot.currentVersion;
  resetVersionInbox(snapshot.currentVersion);
  metadata.currentVersion = snapshot.currentVersion;
  metadata.syncLagVersions = 0;
  metadata.onlineEndpointCount = snapshot.onlineMembers.length;
}

// Seed the confirmed layer from the join or create response. The connection
// manager still fetches a fresh snapshot when the room route mounts.
export function seedRoomSnapshot(snapshot: RoomSnapshot): void {
  applySnapshot(snapshot);
}

function applyIncomingFrame(frame: Frame): void {
  switch (frame.frameKind) {
    case "snapshot":
      applySnapshot(frame.snapshot);
      return;
    case "delta":
      // Ordering, duplicate drops and the interrupt gate live in the draft
      // store, not in the connection layer.
      applyDraftDelta(frame);
      return;
    case "confirm":
    case "edit-receipt": {
      if (frame.frameKind === "confirm") {
        // The confirmed answer leaves the temporary layer. An edit receipt
        // never clears streaming text.
        completeDraftGeneration(frame.record.generationIdentifier);
      }
      // Version buffering, duplicate drops and gap detection live in the
      // version inbox. The frame is applied immediately only when it is the
      // next contiguous version.
      const backfillRange: BackfillRange | null = ingestConfirmedFrame(frame);
      syncConfirmedVersionFromInbox();
      if (backfillRange !== null && !versionInbox.backfillActive) {
        void runBackfill(backfillRange, roomConnection.instanceBaseUrl);
      }
      return;
    }
    case "interrupt":
      // Freeze the boundary preview; late deltas of this generation are
      // dropped by the store.
      applyDraftInterrupt(frame);
      return;
    case "status":
      metadata.instanceIdentifier = frame.status.instanceIdentifier;
      metadata.onlineEndpointCount = frame.status.onlineEndpointCount;
      metadata.currentVersion = Math.max(
        metadata.currentVersion,
        frame.status.currentVersion,
      );
      metadata.syncLagVersions = Math.max(
        frame.status.currentVersion - roomConnection.lastConfirmedVersion,
        0,
      );
      break;
    case "echo":
      // Round-trip measurement belongs to M17 and is not applied here.
      break;
  }
}

function syncConfirmedVersionFromInbox(): void {
  roomConnection.lastConfirmedVersion = versionInbox.lastAppliedVersion;
  metadata.syncLagVersions = Math.max(
    metadata.currentVersion - versionInbox.lastAppliedVersion,
    0,
  );
}

// Fetch one missing version range, page by page, and feed every page into the
// inbox. A later range is processed when a buffered frame still has a gap. A
// cancellation (reconnect or room change) stops the loop without reporting a
// failure, because the new snapshot resets the inbox anyway.
async function runBackfill(
  initialRange: BackfillRange,
  instanceBaseUrl: string,
): Promise<void> {
  const backfillToken: number = connectionToken;
  let range: BackfillRange | null = initialRange;
  let rangeCount: number = 0;

  while (
    range !== null &&
    backfillToken === connectionToken &&
    rangeCount < MAX_BACKFILL_RANGE_COUNT
  ) {
    rangeCount += 1;
    markBackfillStarted(range);
    const startingVersion: number = versionInbox.lastAppliedVersion;
    let page: number = 1;
    let pageCount: number = 0;
    let receivedItemCount: number = 0;
    let hasMorePages: boolean = true;

    while (
      hasMorePages &&
      backfillToken === connectionToken &&
      pageCount < MAX_BACKFILL_PAGE_COUNT
    ) {
      pageCount += 1;
      try {
        const pageEnvelope = await requestRoomFrames({
          instanceBaseUrl,
          roomIdentifier: activeRoomIdentifier,
          endpointIdentifier: identity.endpointIdentifier,
          fromVersion: range.fromVersion,
          toVersion: range.toVersion,
          page,
          pageSize: BACKFILL_PAGE_SIZE,
        });
        if (backfillToken !== connectionToken) {
          return;
        }
        if (pageEnvelope.payload === null) {
          markBackfillFailed(pageEnvelope.message);
          return;
        }
        ingestBackfillPage(pageEnvelope.payload.items);
        syncConfirmedVersionFromInbox();
        receivedItemCount += pageEnvelope.payload.items.length;
        hasMorePages =
          pageEnvelope.payload.items.length > 0 &&
          receivedItemCount < pageEnvelope.payload.total;
        page += 1;
      } catch (error: unknown) {
        if (backfillToken !== connectionToken) {
          return;
        }
        markBackfillFailed(
          error instanceof NetworkRequestError
            ? error.message
            : "The missing frames could not be loaded.",
        );
        return;
      }
    }

    if (hasMorePages) {
      markBackfillFailed("The missing frames could not be loaded.");
      return;
    }

    const nextRange: BackfillRange | null = nextBackfillRange();
    if (
      nextRange !== null &&
      versionInbox.lastAppliedVersion === startingVersion
    ) {
      // The service answered but the gap did not move; do not request forever.
      markBackfillFailed("The missing frames could not be loaded.");
      return;
    }
    range = nextRange;
  }

  if (backfillToken !== connectionToken) {
    return;
  }
  if (range !== null) {
    markBackfillFailed("Too many version gaps were detected.");
    return;
  }
  markBackfillFinished();
  syncConfirmedVersionFromInbox();
}

function handleUnauthorized(message: string): void {
  resetConnection();
  roomConnection.phase = "unauthorized";
  roomConnection.lastError = message;
  roomConnection.instanceIdentifier = "";
  identity.instanceIdentifier = "";
  clearIdentity();
}

function handleStreamFailure(): void {
  closeStream();
  if (activeRoomIdentifier === "") {
    return;
  }
  if (!navigator.onLine) {
    roomConnection.phase = "offline";
    return;
  }
  roomConnection.lastError = "The connection was lost.";
  scheduleRetry();
}

function scheduleRetry(): void {
  roomConnection.attempt += 1;
  roomConnection.phase = "reconnecting";
  if (candidateBaseUrls.length > 1) {
    // Move to the next candidate before the next attempt. When the stopped
    // instance comes back it is tried again on a later cycle.
    candidateIndex = (candidateIndex + 1) % candidateBaseUrls.length;
    roomConnection.instanceBaseUrl =
      candidateBaseUrls[candidateIndex] ?? roomConnection.instanceBaseUrl;
  }
  clearRetryTimer();
  retryTimerIdentifier = window.setTimeout(() => {
    retryTimerIdentifier = null;
    void attemptConnection();
  }, reconnectDelayMilliseconds(roomConnection.attempt));
}

function handleAttemptFailure(error: unknown): void {
  const message: string =
    error instanceof NetworkRequestError
      ? error.message
      : "The connection could not be established.";
  roomConnection.lastError = message;
  if (!navigator.onLine) {
    roomConnection.phase = "offline";
    return;
  }
  scheduleRetry();
}

async function sendHeartbeatBestEffort(instanceBaseUrl: string): Promise<void> {
  try {
    await requestHeartbeat({
      instanceBaseUrl,
      roomIdentifier: activeRoomIdentifier,
      endpointIdentifier: identity.endpointIdentifier,
    });
  } catch {
    // The stream itself keeps the endpoint online; a failed heartbeat is not
    // worth a reconnect.
  }
}

function openStream(
  instanceBaseUrl: string,
  lastConfirmedVersion: number,
): void {
  const openedToken: number = connectionToken;
  streamConnection = openFrameStream({
    instanceBaseUrl,
    roomIdentifier: activeRoomIdentifier,
    endpointIdentifier: identity.endpointIdentifier,
    lastEventIdentifier: lastConfirmedVersion,
    onFrame: (frame: Frame): void => {
      if (openedToken === connectionToken) {
        applyIncomingFrame(frame);
      }
    },
    onConnectionError: (): void => {
      if (openedToken === connectionToken) {
        handleStreamFailure();
      }
    },
    onAuthenticationError: (message: string): void => {
      if (openedToken === connectionToken) {
        handleUnauthorized(message);
      }
    },
  });
}

async function attemptConnection(): Promise<void> {
  if (activeRoomIdentifier === "" || isAttemptRunning) {
    return;
  }
  if (!navigator.onLine) {
    roomConnection.phase = "offline";
    return;
  }

  isAttemptRunning = true;
  const attemptToken: number = connectionToken;
  clearRetryTimer();

  const instanceBaseUrl: string = candidateBaseUrls[candidateIndex] ?? "";
  roomConnection.instanceBaseUrl = instanceBaseUrl;
  roomConnection.phase =
    roomConnection.attempt === 0 ? "loading" : "reconnecting";

  const controller: AbortController = new AbortController();
  attemptController = controller;

  try {
    const snapshotEnvelope = await requestRoomSnapshot({
      instanceBaseUrl,
      roomIdentifier: activeRoomIdentifier,
      endpointIdentifier: identity.endpointIdentifier,
      signal: controller.signal,
    });
    if (attemptToken !== connectionToken) {
      return;
    }
    if (snapshotEnvelope.code === 401) {
      handleUnauthorized(snapshotEnvelope.message);
      return;
    }
    if (snapshotEnvelope.payload === null) {
      roomConnection.phase = "failed";
      roomConnection.lastError = snapshotEnvelope.message;
      return;
    }

    // Snapshot first, stream second. This ordering is the whole point of M11:
    // a new or reconnecting endpoint never depends on the stream to learn the
    // history it missed.
    const snapshot: RoomSnapshot = snapshotEnvelope.payload;
    applySnapshot(snapshot);

    let instanceIdentifier: string = "";
    try {
      const healthEnvelope = await requestHealth(
        instanceBaseUrl,
        controller.signal,
      );
      if (healthEnvelope.payload !== null) {
        instanceIdentifier = healthEnvelope.payload.instanceIdentifier;
      }
    } catch {
      // A health probe failure is not fatal; the snapshot already proved that
      // this instance answers.
    }
    if (attemptToken !== connectionToken) {
      return;
    }

    roomConnection.instanceIdentifier = instanceIdentifier;
    identity.instanceIdentifier = instanceIdentifier;
    // The badge reads the metadata store, so the instance reading has to land
    // there as well; the status frame may refine it later.
    metadata.instanceIdentifier = instanceIdentifier;
    persistPreferredInstanceBaseUrl(instanceBaseUrl);

    roomConnection.attempt = 0;
    roomConnection.phase = "connected";
    roomConnection.lastError = "";
    openStream(instanceBaseUrl, snapshot.currentVersion);
    void sendHeartbeatBestEffort(instanceBaseUrl);
  } catch (error: unknown) {
    if (attemptToken !== connectionToken) {
      return;
    }
    handleAttemptFailure(error);
  } finally {
    if (attemptController === controller) {
      attemptController = null;
    }
    if (attemptToken === connectionToken) {
      isAttemptRunning = false;
    }
  }
}

// Attach to a room. Repeated calls for the same room are ignored, so moving
// between room sub pages never reopens the stream.
export function connect(roomIdentifier: string): void {
  if (roomIdentifier === "") {
    return;
  }
  if (
    activeRoomIdentifier === roomIdentifier &&
    roomConnection.phase !== "idle"
  ) {
    return;
  }

  resetConnection();
  resetVersionInbox(0);
  activeRoomIdentifier = roomIdentifier;
  candidateBaseUrls = [...getCandidateInstanceBaseUrls()];
  const preferredBaseUrl: string = readPreferredInstanceBaseUrl();
  const preferredIndex: number = candidateBaseUrls.indexOf(preferredBaseUrl);
  candidateIndex = preferredIndex >= 0 ? preferredIndex : 0;

  roomConnection.roomIdentifier = roomIdentifier;
  roomConnection.instanceBaseUrl = candidateBaseUrls[candidateIndex] ?? "";
  roomConnection.instanceIdentifier = "";
  metadata.instanceIdentifier = "";
  roomConnection.attempt = 0;
  roomConnection.lastConfirmedVersion = 0;
  roomConnection.lastError = "";
  roomConnection.phase = "loading";
  void attemptConnection();
}

export function disconnect(): void {
  resetConnection();
  resetVersionInbox(0);
  activeRoomIdentifier = "";
  candidateBaseUrls = [];
  candidateIndex = 0;
  roomConnection.phase = "idle";
  roomConnection.roomIdentifier = "";
  roomConnection.instanceIdentifier = "";
  roomConnection.instanceBaseUrl = "";
  roomConnection.attempt = 0;
  roomConnection.lastConfirmedVersion = 0;
  roomConnection.lastError = "";
}

// Skip the backoff wait and try the current candidate again.
export function reconnectNow(): void {
  if (activeRoomIdentifier === "") {
    return;
  }
  resetConnection();
  roomConnection.attempt = 0;
  roomConnection.phase = "loading";
  void attemptConnection();
}

// Rotate to the next configured instance and reconnect immediately.
export function switchToNextInstance(): void {
  if (candidateBaseUrls.length < 2) {
    return;
  }
  candidateIndex = (candidateIndex + 1) % candidateBaseUrls.length;
  reconnectNow();
}

// Pin the connection to one configured instance, used by the settings page.
export function selectInstance(instanceBaseUrl: string): void {
  const selectedIndex: number = candidateBaseUrls.indexOf(instanceBaseUrl);
  if (selectedIndex < 0) {
    return;
  }
  candidateIndex = selectedIndex;
  reconnectNow();
}

export function canSwitchInstance(): boolean {
  return hasMultipleInstanceCandidates();
}

function handleBrowserOffline(): void {
  if (activeRoomIdentifier === "") {
    return;
  }
  resetConnection();
  roomConnection.phase = "offline";
}

function handleBrowserOnline(): void {
  if (activeRoomIdentifier === "") {
    return;
  }
  if (
    roomConnection.phase === "connected" ||
    roomConnection.phase === "unauthorized"
  ) {
    return;
  }
  reconnectNow();
}

if (typeof window !== "undefined") {
  window.addEventListener("offline", handleBrowserOffline);
  window.addEventListener("online", handleBrowserOnline);
}
