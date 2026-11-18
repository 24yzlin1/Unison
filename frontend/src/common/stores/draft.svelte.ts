// Pending generation state. This is the temporary layer: it is rendered on
// screen only and must never enter the confirmed history or take part in
// arbitration. Receiving an interrupt clears it immediately.

export interface DraftState {
  generationActive: boolean;
  inputLocked: boolean;
  pendingText: string;
}

export const draft = $state<DraftState>({
  generationActive: false,
  inputLocked: false,
  pendingText: "",
});

// Append incoming stream text to the pending draft. Never write to history here.
export function appendDraftText(frameText: string): void {
  draft.pendingText += frameText;
}

// Clear the pending draft, e.g. at an interrupt boundary or after a rollback.
export function clearDraft(): void {
  draft.pendingText = "";
  draft.generationActive = false;
}
