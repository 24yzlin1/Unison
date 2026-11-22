// Identity of this endpoint. Defined by F1; F2 and F3 consume it read-only.
// The endpoint identifier persists across reloads and instance switches.

const ENDPOINT_IDENTIFIER_STORAGE_KEY = "unison.endpointIdentifier";
const DISPLAY_NAME_STORAGE_KEY = "unison.displayName";
const ROOM_IDENTIFIER_STORAGE_KEY = "unison.roomIdentifier";

function readStorageValue(storageKey: string): string {
  try {
    return localStorage.getItem(storageKey) ?? "";
  } catch {
    // Storage can be unavailable in private browsing; identity stays memory-only.
    return "";
  }
}

function writeStorageValue(storageKey: string, storageValue: string): void {
  try {
    localStorage.setItem(storageKey, storageValue);
  } catch {
    // Ignore persistence failures; the value stays valid for this session.
  }
}

function removeStorageValue(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore removal failures; the in-memory state is already cleared.
  }
}

export interface IdentityState {
  endpointIdentifier: string;
  displayName: string;
  roomIdentifier: string;
  instanceIdentifier: string;
}

export const identity = $state<IdentityState>({
  endpointIdentifier: readStorageValue(ENDPOINT_IDENTIFIER_STORAGE_KEY),
  displayName: readStorageValue(DISPLAY_NAME_STORAGE_KEY),
  roomIdentifier: readStorageValue(ROOM_IDENTIFIER_STORAGE_KEY),
  instanceIdentifier: "",
});

// Persist the endpoint identifier, display name and room identifier. Call after
// assigning them; the reconnect path depends on all three staying stable.
export function persistIdentity(): void {
  writeStorageValue(
    ENDPOINT_IDENTIFIER_STORAGE_KEY,
    identity.endpointIdentifier,
  );
  writeStorageValue(DISPLAY_NAME_STORAGE_KEY, identity.displayName);
  writeStorageValue(ROOM_IDENTIFIER_STORAGE_KEY, identity.roomIdentifier);
}

// Temporary stand-in for the identifier the join endpoint will issue in W1.
// The value is stable across reloads and instance switches, so the route guard
// and the reconnect path behave exactly like the final contract.
export function ensureEndpointIdentifier(): string {
  if (identity.endpointIdentifier === "") {
    identity.endpointIdentifier = `ENDPOINT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    persistIdentity();
  }
  return identity.endpointIdentifier;
}

// Clear every local identity value. Used by the settings page after a second
// confirmation; the route guard then sends the visitor back to the join page.
export function clearIdentity(): void {
  identity.endpointIdentifier = "";
  identity.displayName = "";
  identity.roomIdentifier = "";
  identity.instanceIdentifier = "";
  removeStorageValue(ENDPOINT_IDENTIFIER_STORAGE_KEY);
  removeStorageValue(DISPLAY_NAME_STORAGE_KEY);
  removeStorageValue(ROOM_IDENTIFIER_STORAGE_KEY);
}
