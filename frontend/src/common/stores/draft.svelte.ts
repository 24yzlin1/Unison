import { SvelteMap } from "svelte/reactivity";

import type { DeltaFrame, InterruptFrame } from "@/common/api/roomContract";

// Pending generation state. This is the temporary layer: it is rendered on
// screen only and must never enter the confirmed history or take part in
// arbitration. A generation is identified by generationIdentifier; streaming
// text is ordered by sequenceNumber inside one base version.
export interface DraftState {
  // Generation currently shown. Empty before the first question of a room.
  generationIdentifier: string;
  // Confirmed version the generation is based on. Deltas never change it.
  baseVersion: number;
  // Text of the active generation, appended in sequence order.
  pendingText: string;
  // Text frozen at the server boundary after an interrupt. It is still only a
  // preview: it never enters the history and a later question discards it.
  interruptedText: string;
  // Last applied delta sequence number. -1 means "no delta applied yet".
  lastSequenceNumber: number;
  // True while the generation is still receiving deltas.
  generationActive: boolean;
  // True after the server reported the interrupt boundary.
  interrupted: boolean;
  // Server assigned boundary, 0 when the generation was not interrupted.
  boundary: number;
  // Local input lock while a question is in flight.
  inputLocked: boolean;
}

export const draft = $state<DraftState>({
  generationIdentifier: "",
  baseVersion: 0,
  pendingText: "",
  interruptedText: "",
  lastSequenceNumber: -1,
  generationActive: false,
  interrupted: false,
  boundary: 0,
  inputLocked: false,
});

// Deltas that arrived ahead of their turn. The stream is ordered on one
// connection, but a reconnect or a cross-instance burst can still deliver a
// gap; buffering keeps the displayed text identical on every endpoint.
const MAX_BUFFERED_DELTA_COUNT = 128;
const bufferedDeltas: SvelteMap<number, string> = new SvelteMap();

// Generations that are already confirmed or interrupted. A late delta for one
// of them must never reopen the temporary layer.
const MAX_CLOSED_GENERATION_COUNT = 32;
const closedGenerationIdentifiers: string[] = [];

function closeGeneration(generationIdentifier: string): void {
  if (closedGenerationIdentifiers.includes(generationIdentifier)) {
    return;
  }
  closedGenerationIdentifiers.push(generationIdentifier);
  if (closedGenerationIdentifiers.length > MAX_CLOSED_GENERATION_COUNT) {
    closedGenerationIdentifiers.shift();
  }
}

function resetBufferedDeltas(): void {
  bufferedDeltas.clear();
}

function appendNextDeltas(): void {
  let nextText: string | undefined = bufferedDeltas.get(
    draft.lastSequenceNumber + 1,
  );
  while (nextText !== undefined) {
    draft.pendingText += nextText;
    draft.lastSequenceNumber += 1;
    bufferedDeltas.delete(draft.lastSequenceNumber);
    nextText = bufferedDeltas.get(draft.lastSequenceNumber + 1);
  }
}

// Start a new generation and lock the local input. Called when the first delta
// of an unknown generation arrives, and by the ask page before it submits.
export function beginDraftGeneration(
  generationIdentifier: string,
  baseVersion: number,
): void {
  resetBufferedDeltas();
  draft.generationIdentifier = generationIdentifier;
  draft.baseVersion = baseVersion;
  draft.pendingText = "";
  draft.interruptedText = "";
  draft.lastSequenceNumber = -1;
  draft.generationActive = true;
  draft.interrupted = false;
  draft.boundary = 0;
  draft.inputLocked = true;
}

// Apply one delta frame. Duplicates and stale sequence numbers are dropped,
// and a closed generation never accepts new text.
export function applyDraftDelta(frame: DeltaFrame): void {
  if (closedGenerationIdentifiers.includes(frame.generationIdentifier)) {
    return;
  }
  if (frame.generationIdentifier === draft.generationIdentifier) {
    if (draft.interrupted || !draft.generationActive) {
      return;
    }
  } else {
    beginDraftGeneration(frame.generationIdentifier, frame.version);
  }

  if (draft.lastSequenceNumber < 0) {
    // The first delta defines the sequence baseline, so a service that starts
    // at 0 and one that starts at 1 both work.
    draft.pendingText += frame.text;
    draft.lastSequenceNumber = frame.sequenceNumber;
    appendNextDeltas();
    return;
  }

  if (frame.sequenceNumber <= draft.lastSequenceNumber) {
    return;
  }
  if (frame.sequenceNumber === draft.lastSequenceNumber + 1) {
    draft.pendingText += frame.text;
    draft.lastSequenceNumber = frame.sequenceNumber;
    appendNextDeltas();
    return;
  }

  bufferedDeltas.set(frame.sequenceNumber, frame.text);
  if (bufferedDeltas.size > MAX_BUFFERED_DELTA_COUNT) {
    // A gap this large means the generation is unrecoverable; drop the buffer
    // instead of growing without bound. Later frames can start a new baseline.
    resetBufferedDeltas();
  }
}

// Apply the server interrupt boundary. The active text is cleared from the
// draft layer, and a truncated preview is frozen at the shared boundary. Four
// endpoints therefore stop at the same character even when their local stream
// had received different amounts.
export function applyDraftInterrupt(frame: InterruptFrame): void {
  if (closedGenerationIdentifiers.includes(frame.generationIdentifier)) {
    // A duplicate interrupt for a generation that already stopped must not
    // reopen its boundary preview.
    return;
  }
  if (
    draft.generationIdentifier !== "" &&
    frame.generationIdentifier !== draft.generationIdentifier
  ) {
    // An interrupt for an older generation must not truncate a newer draft.
    return;
  }
  const boundary: number = Math.max(frame.boundary, 0);
  draft.generationIdentifier = frame.generationIdentifier;
  draft.interruptedText = draft.pendingText.slice(0, boundary);
  draft.pendingText = "";
  draft.lastSequenceNumber = -1;
  draft.generationActive = false;
  draft.interrupted = true;
  draft.boundary = boundary;
  draft.inputLocked = false;
  resetBufferedDeltas();
  closeGeneration(frame.generationIdentifier);
}

// Clear both the active text and the frozen boundary preview. Used on snapshot,
// on a confirmed answer, and when the next question starts.
export function clearDraft(): void {
  resetBufferedDeltas();
  draft.generationIdentifier = "";
  draft.baseVersion = 0;
  draft.pendingText = "";
  draft.interruptedText = "";
  draft.lastSequenceNumber = -1;
  draft.generationActive = false;
  draft.interrupted = false;
  draft.boundary = 0;
  draft.inputLocked = false;
}

// Clear the draft only when the confirmed record belongs to it. An edit receipt
// must not clear the streaming text of another generation.
export function completeDraftGeneration(
  generationIdentifier: string | null,
): void {
  if (generationIdentifier === null) {
    return;
  }
  if (
    draft.generationIdentifier !== "" &&
    draft.generationIdentifier !== generationIdentifier
  ) {
    return;
  }
  closeGeneration(generationIdentifier);
  clearDraft();
}
