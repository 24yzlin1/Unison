// Offline operation queue. Entries carry the baseVersion observed at the time
// the operation was issued. On recovery the client first fetches the snapshot,
// then pulls missing frames, and finally replays the queue in order.

export type OutboxEntryKind = "ask" | "edit" | "interrupt";

export interface OutboxEntry {
  kind: OutboxEntryKind;
  content: string;
  baseVersion: number;
}

interface OutboxState {
  entries: OutboxEntry[];
}

export const outbox = $state<OutboxState>({
  entries: [],
});

// Queue an operation issued while offline.
export function enqueueOutboxEntry(entry: OutboxEntry): void {
  outbox.entries = [...outbox.entries, entry];
}

// Drop the leading entries after they have been replayed successfully.
export function drainOutboxEntries(entryCount: number): void {
  outbox.entries = outbox.entries.slice(entryCount);
}
