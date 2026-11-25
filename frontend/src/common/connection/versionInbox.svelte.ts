import { SvelteMap } from "svelte/reactivity";

import type {
  ConfirmedFrame,
  ConfirmedRecord,
} from "@/common/api/roomContract";
import { appendConfirmedRecord } from "@/common/stores/history.svelte";
import { metadata } from "@/common/stores/metadata.svelte";

// The version inbox keeps the confirmed layer contiguous. Confirmed class
// frames may arrive out of order across instances, so a frame that is ahead of
// the local version waits in a buffer while the missing range is fetched from
// GET /api/rooms/:roomIdentifier/frames. Version order comes from the server;
// a local clock is never used.

export interface BackfillRange {
  fromVersion: number;
  toVersion: number;
}

export interface VersionInboxState {
  // Highest confirmed version applied locally.
  lastAppliedVersion: number;
  // Frames waiting for a missing predecessor.
  bufferedFrameCount: number;
  // Number of distinct gaps detected in this connection.
  gapsDetected: number;
  // Number of backfill range requests started.
  backfillRequestCount: number;
  // True while a range request is in flight.
  backfillActive: boolean;
  lastBackfillFromVersion: number;
  lastBackfillToVersion: number;
  lastError: string;
}

export const versionInbox = $state<VersionInboxState>({
  lastAppliedVersion: 0,
  bufferedFrameCount: 0,
  gapsDetected: 0,
  backfillRequestCount: 0,
  backfillActive: false,
  lastBackfillFromVersion: 0,
  lastBackfillToVersion: 0,
  lastError: "",
});

// A confirmed record frame: confirm and edit-receipt both advance the version.
interface RecordFrame {
  version: number;
  record: ConfirmedRecord;
}

const MAX_BUFFERED_FRAME_COUNT = 256;
const bufferedFrames: SvelteMap<number, RecordFrame> = new SvelteMap();
let lastDetectedRangeKey: string = "";

function updateBufferedCount(): void {
  versionInbox.bufferedFrameCount = bufferedFrames.size;
}

function applyRecordFrame(frame: RecordFrame): void {
  appendConfirmedRecord({
    version: frame.record.version,
    content: frame.record.content,
    authorDisplayName: frame.record.displayName,
  });
  versionInbox.lastAppliedVersion = frame.version;
  metadata.currentVersion = Math.max(metadata.currentVersion, frame.version);
  metadata.syncLagVersions = Math.max(
    metadata.currentVersion - versionInbox.lastAppliedVersion,
    0,
  );
}

// Apply every buffered frame that is now contiguous.
function drainBufferedFrames(): void {
  let nextFrame: RecordFrame | undefined = bufferedFrames.get(
    versionInbox.lastAppliedVersion + 1,
  );
  while (nextFrame !== undefined) {
    bufferedFrames.delete(versionInbox.lastAppliedVersion + 1);
    applyRecordFrame(nextFrame);
    nextFrame = bufferedFrames.get(versionInbox.lastAppliedVersion + 1);
  }
  updateBufferedCount();
}

// The next missing range, inferred from the smallest buffered version. The
// range is empty when nothing is missing or a frame is already contiguous.
export function nextBackfillRange(): BackfillRange | null {
  if (bufferedFrames.size === 0) {
    return null;
  }
  let smallestBufferedVersion: number = Number.POSITIVE_INFINITY;
  for (const bufferedVersion of bufferedFrames.keys()) {
    if (bufferedVersion < smallestBufferedVersion) {
      smallestBufferedVersion = bufferedVersion;
    }
  }
  if (smallestBufferedVersion <= versionInbox.lastAppliedVersion + 1) {
    return null;
  }
  const range: BackfillRange = {
    fromVersion: versionInbox.lastAppliedVersion + 1,
    toVersion: smallestBufferedVersion - 1,
  };
  const rangeKey: string = `${range.fromVersion}:${range.toVersion}`;
  if (rangeKey !== lastDetectedRangeKey) {
    lastDetectedRangeKey = rangeKey;
    versionInbox.gapsDetected += 1;
  }
  return range;
}

// Reset for a new room or a new snapshot. The snapshot version is the new
// baseline; any buffered frame from the previous connection is discarded.
export function resetVersionInbox(confirmedVersion: number): void {
  bufferedFrames.clear();
  lastDetectedRangeKey = "";
  versionInbox.lastAppliedVersion = confirmedVersion;
  versionInbox.bufferedFrameCount = 0;
  versionInbox.gapsDetected = 0;
  versionInbox.backfillRequestCount = 0;
  versionInbox.backfillActive = false;
  versionInbox.lastBackfillFromVersion = 0;
  versionInbox.lastBackfillToVersion = 0;
  versionInbox.lastError = "";
}

// Accept one live confirm or edit-receipt frame. Returns the missing range that
// must be fetched, or null when the frame was applied or dropped as a duplicate.
export function ingestConfirmedFrame(frame: RecordFrame): BackfillRange | null {
  if (frame.version <= versionInbox.lastAppliedVersion) {
    // Duplicate or stale: the version, not arrival order, decides.
    return null;
  }
  if (frame.version === versionInbox.lastAppliedVersion + 1) {
    applyRecordFrame(frame);
    drainBufferedFrames();
    return nextBackfillRange();
  }
  if (!bufferedFrames.has(frame.version)) {
    bufferedFrames.set(frame.version, frame);
    updateBufferedCount();
  }
  if (bufferedFrames.size > MAX_BUFFERED_FRAME_COUNT) {
    bufferedFrames.clear();
    updateBufferedCount();
    versionInbox.lastError = "Too many frames were missing.";
    return null;
  }
  return nextBackfillRange();
}

// Accept one page of backfilled frames. Items are sorted by version before they
// enter the buffer, so a page that arrives in a different order still applies
// deterministically.
export function ingestBackfillPage(frames: readonly ConfirmedFrame[]): void {
  const recordFrames: RecordFrame[] = frames
    .filter(
      (
        frame: ConfirmedFrame,
      ): frame is ConfirmedFrame & { record: ConfirmedRecord } =>
        frame.frameKind !== "interrupt" && frame.record !== null,
    )
    .map((frame) => ({ version: frame.version, record: frame.record }));
  recordFrames.sort((first, second) => first.version - second.version);

  for (const recordFrame of recordFrames) {
    if (recordFrame.version <= versionInbox.lastAppliedVersion) {
      continue;
    }
    if (recordFrame.version === versionInbox.lastAppliedVersion + 1) {
      applyRecordFrame(recordFrame);
      drainBufferedFrames();
      continue;
    }
    if (!bufferedFrames.has(recordFrame.version)) {
      bufferedFrames.set(recordFrame.version, recordFrame);
    }
  }
  if (bufferedFrames.size > MAX_BUFFERED_FRAME_COUNT) {
    // A gap this large cannot be repaired by paging; keep the newest window.
    bufferedFrames.clear();
    versionInbox.lastError = "Too many frames were missing.";
  }
  updateBufferedCount();
}

export function markBackfillStarted(range: BackfillRange): void {
  versionInbox.backfillActive = true;
  versionInbox.backfillRequestCount += 1;
  versionInbox.lastBackfillFromVersion = range.fromVersion;
  versionInbox.lastBackfillToVersion = range.toVersion;
  versionInbox.lastError = "";
}

export function markBackfillFinished(): void {
  versionInbox.backfillActive = false;
}

export function markBackfillFailed(message: string): void {
  versionInbox.backfillActive = false;
  versionInbox.lastError = message;
}
