// Confirmed records with a server version. This store is the single source of
// truth on the client. Only records confirmed by the server may enter here;
// streaming content belongs to the draft store.

export interface HistoryRecord {
  version: number;
  content: string;
  authorDisplayName: string;
}

interface HistoryState {
  records: HistoryRecord[];
}

export const history = $state<HistoryState>({
  records: [],
});

// Replace the records with a server snapshot. The server version is the only
// ordering source; no local clock or merge algorithm is used.
export function applyHistorySnapshot(snapshotRecords: HistoryRecord[]): void {
  history.records = snapshotRecords;
}

// Append one confirmed record after the server has assigned its version.
export function appendConfirmedRecord(record: HistoryRecord): void {
  history.records = [...history.records, record];
}
