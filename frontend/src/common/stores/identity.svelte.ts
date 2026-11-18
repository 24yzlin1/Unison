// Identity of this endpoint. Defined by F1; F2 and F3 consume it read-only.
// The endpoint identifier persists across reloads and reconnects.

const ENDPOINT_IDENTIFIER_STORAGE_KEY = "unison.endpointIdentifier";

function readPersistedEndpointIdentifier(): string {
  try {
    return localStorage.getItem(ENDPOINT_IDENTIFIER_STORAGE_KEY) ?? "";
  } catch {
    // Storage can be unavailable in private browsing; identity stays memory-only.
    return "";
  }
}

export interface IdentityState {
  endpointIdentifier: string;
  displayName: string;
  roomIdentifier: string;
  instanceIdentifier: string;
}

export const identity = $state<IdentityState>({
  endpointIdentifier: readPersistedEndpointIdentifier(),
  displayName: "",
  roomIdentifier: "",
  instanceIdentifier: "",
});

// Persist the endpoint identifier. Call after assigning a new identifier.
export function persistIdentity(): void {
  try {
    localStorage.setItem(
      ENDPOINT_IDENTIFIER_STORAGE_KEY,
      identity.endpointIdentifier,
    );
  } catch {
    // Ignore persistence failures; the identifier stays valid for this session.
  }
}
