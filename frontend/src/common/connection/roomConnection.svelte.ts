import {
  openFrameStream,
  type FrameStreamConnection,
} from "@/common/api/frameStreamClient";
import {
  requestHealth,
  requestHeartbeat,
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
  appendDraftText,
  clearDraft,
  draft,
} from "@/common/stores/draft.svelte";
import {
  appendConfirmedRecord,
  applyHistorySnapshot,
} from "@/common/stores/history.svelte";
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
  draft.inputLocked = false;
  roomConnection.lastConfirmedVersion = snapshot.currentVersion;
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
      draft.generationActive = true;
      appendDraftText(frame.text);
      return;
    case "confirm":
    case "edit-receipt":
      // A frame may repeat after a reconnect; the version is the only dedupe
      // key and a local clock is never used.
      if (frame.record.version <= roomConnection.lastConfirmedVersion) {
        return;
      }
      appendConfirmedRecord({
        version: frame.record.version,
        content: frame.record.content,
        authorDisplayName: frame.record.displayName,
      });
      roomConnection.lastConfirmedVersion = frame.record.version;
      metadata.currentVersion = Math.max(
        metadata.currentVersion,
        frame.record.version,
      );
      metadata.syncLagVersions = Math.max(
        metadata.currentVersion - roomConnection.lastConfirmedVersion,
        0,
      );
      if (frame.frameKind === "confirm") {
        // The confirmed answer leaves the temporary layer.
        clearDraft();
        draft.inputLocked = false;
      }
      return;
    case "interrupt":
      clearDraft();
      draft.inputLocked = false;
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
