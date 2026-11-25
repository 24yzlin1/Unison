// Candidate service instances. The demo runs two or three stateless instances
// on the LAN; a device may attach to any of them and must be able to move to
// another one without losing its endpoint identity.
//
// The list comes from VITE_INSTANCE_URLS, a comma separated list of absolute
// base URLs. When the variable is empty the page origin is the only candidate,
// which is the normal case for a single instance or the Vite proxy.

const INSTANCE_BASE_URL_STORAGE_KEY = "unison.instanceBaseUrl";
const SAME_ORIGIN_BASE_URL = "";

function readStorageValue(storageKey: string): string {
  try {
    return localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function writeStorageValue(storageKey: string, storageValue: string): void {
  try {
    localStorage.setItem(storageKey, storageValue);
  } catch {
    // Storage can be unavailable in private browsing; the value stays memory-only.
  }
}

function normalizeInstanceBaseUrl(candidate: string): string {
  const trimmed: string = candidate.trim();
  if (trimmed === "") {
    return SAME_ORIGIN_BASE_URL;
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

// Read the candidate list. The order is stable: it is the order the demo
// operator wrote in the environment, and the connection manager walks it in
// that order when an instance disappears.
export function getCandidateInstanceBaseUrls(): readonly string[] {
  const configuredValue: string = import.meta.env.VITE_INSTANCE_URLS ?? "";
  const candidates: string[] = [];
  for (const rawCandidate of configuredValue.split(",")) {
    const candidate: string = normalizeInstanceBaseUrl(rawCandidate);
    if (rawCandidate.trim() === "") {
      continue;
    }
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }
  if (candidates.length === 0) {
    return [SAME_ORIGIN_BASE_URL];
  }
  return candidates;
}

// The instance that last accepted a connection. It is a hint only; an instance
// that disappeared is skipped by the connection manager.
export function readPreferredInstanceBaseUrl(): string {
  return normalizeInstanceBaseUrl(
    readStorageValue(INSTANCE_BASE_URL_STORAGE_KEY),
  );
}

export function persistPreferredInstanceBaseUrl(instanceBaseUrl: string): void {
  writeStorageValue(
    INSTANCE_BASE_URL_STORAGE_KEY,
    normalizeInstanceBaseUrl(instanceBaseUrl),
  );
}

// The instance used for the entry calls (join and create). Prefer the last
// working instance, then the first configured candidate.
export function resolveEntryInstanceBaseUrl(): string {
  const preferred: string = readPreferredInstanceBaseUrl();
  const candidates: readonly string[] = getCandidateInstanceBaseUrls();
  if (candidates.includes(preferred)) {
    return preferred;
  }
  return candidates[0] ?? SAME_ORIGIN_BASE_URL;
}

export function hasMultipleInstanceCandidates(): boolean {
  return getCandidateInstanceBaseUrls().length > 1;
}

// Short human readable instance address for the settings page.
export function describeInstanceBaseUrl(instanceBaseUrl: string): string {
  if (instanceBaseUrl === SAME_ORIGIN_BASE_URL) {
    return window.location.host;
  }
  try {
    return new URL(instanceBaseUrl).host;
  } catch {
    return instanceBaseUrl;
  }
}
