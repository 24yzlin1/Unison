// Badge readings refreshed once per second. Every value comes from the server;
// local estimation is not allowed. F3 consumes this store read-only.

export interface MetadataState {
  instanceIdentifier: string;
  onlineEndpointCount: number;
  roundTripTimeMilliseconds: number;
  currentVersion: number;
  syncLagVersions: number;
}

export const metadata = $state<MetadataState>({
  instanceIdentifier: "",
  onlineEndpointCount: 0,
  roundTripTimeMilliseconds: 0,
  currentVersion: 0,
  syncLagVersions: 0,
});

// Apply a full set of readings from the server status response.
export function applyMetadataReadings(readings: MetadataState): void {
  metadata.instanceIdentifier = readings.instanceIdentifier;
  metadata.onlineEndpointCount = readings.onlineEndpointCount;
  metadata.roundTripTimeMilliseconds = readings.roundTripTimeMilliseconds;
  metadata.currentVersion = readings.currentVersion;
  metadata.syncLagVersions = readings.syncLagVersions;
}
