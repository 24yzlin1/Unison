import {
  ROUTE_NAME_NOT_FOUND,
  findRouteByName,
  routes,
  type ResolvedRouteName,
  type RouteRecord,
} from "@/common/router/routes";
import { identity } from "@/common/stores/identity.svelte";

// Route state is the single source of truth for the current location. Pages
// read it through this module and never parse window.location themselves.
export interface RouterState {
  // Normalized path without the leading hash, for example /rooms/ROOM-1/ask.
  path: string;
  // Query parameters of the hash, parsed once per navigation.
  query: Readonly<Record<string, string>>;
  // Matched route name, or the not-found pseudo route.
  routeName: ResolvedRouteName;
  // Dynamic path parameters, for example { roomIdentifier: "ROOM-1" }.
  parameters: Readonly<Record<string, string>>;
}

export const router = $state<RouterState>({
  path: "/",
  query: {},
  routeName: ROUTE_NAME_NOT_FOUND,
  parameters: {},
});

interface CompiledSegment {
  readonly isParameter: boolean;
  readonly value: string;
}

interface CompiledRoute {
  readonly record: RouteRecord;
  readonly segments: readonly CompiledSegment[];
}

interface LocationParts {
  readonly path: string;
  readonly query: Record<string, string>;
}

interface MatchResult {
  readonly record: RouteRecord;
  readonly parameters: Record<string, string>;
}

export interface NavigateOptions {
  // Replace the current history entry instead of pushing a new one.
  readonly replace?: boolean;
}

function compileRoute(record: RouteRecord): CompiledRoute {
  const segments: CompiledSegment[] = record.pattern
    .split("/")
    .filter((segment: string): boolean => segment !== "")
    .map((segment: string): CompiledSegment => {
      const isParameter: boolean = segment.startsWith(":");
      return {
        isParameter,
        value: isParameter ? segment.slice(1) : segment,
      };
    });
  return { record, segments };
}

const compiledRoutes: readonly CompiledRoute[] = routes.map(compileRoute);

// Turn any input into a leading-slash path without a trailing slash. The empty
// input maps to the landing route.
export function normalizePath(candidate: string): string {
  let path: string = candidate.trim();
  if (path === "") {
    return "/";
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path;
}

function splitPath(path: string): string[] {
  return path.split("/").filter((segment: string): boolean => segment !== "");
}

// Split a navigation target such as /rooms/ROOM-1?page=2 into a path and a
// query string. The query string keeps its leading question mark.
function splitTarget(target: string): { path: string; search: string } {
  const questionMarkIndex: number = target.indexOf("?");
  if (questionMarkIndex < 0) {
    return { path: normalizePath(target), search: "" };
  }
  return {
    path: normalizePath(target.slice(0, questionMarkIndex)),
    search: target.slice(questionMarkIndex),
  };
}

function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  const searchParameters: URLSearchParams = new URLSearchParams(search);
  searchParameters.forEach((value: string, key: string): void => {
    query[key] = value;
  });
  return query;
}

function decodeParameter(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // A malformed escape sequence keeps the raw segment instead of throwing.
    return value;
  }
}

function matchPath(path: string): MatchResult | null {
  const pathSegments: string[] = splitPath(path);
  for (const compiledRoute of compiledRoutes) {
    if (compiledRoute.segments.length !== pathSegments.length) {
      continue;
    }
    const parameters: Record<string, string> = {};
    let isMatched: boolean = true;
    for (
      let segmentIndex: number = 0;
      segmentIndex < compiledRoute.segments.length;
      segmentIndex += 1
    ) {
      const routeSegment: CompiledSegment | undefined =
        compiledRoute.segments[segmentIndex];
      const pathSegment: string | undefined = pathSegments[segmentIndex];
      if (routeSegment === undefined || pathSegment === undefined) {
        isMatched = false;
        break;
      }
      if (routeSegment.isParameter) {
        if (pathSegment === "") {
          isMatched = false;
          break;
        }
        parameters[routeSegment.value] = decodeParameter(pathSegment);
        continue;
      }
      if (routeSegment.value !== pathSegment) {
        isMatched = false;
        break;
      }
    }
    if (isMatched) {
      return { record: compiledRoute.record, parameters };
    }
  }
  return null;
}

function readLocationFromHash(): LocationParts {
  const rawHash: string = window.location.hash;
  const withoutHash: string = rawHash.startsWith("#")
    ? rawHash.slice(1)
    : rawHash;
  const questionMarkIndex: number = withoutHash.indexOf("?");
  if (questionMarkIndex < 0) {
    return {
      path: normalizePath(withoutHash),
      query: {},
    };
  }
  return {
    path: normalizePath(withoutHash.slice(0, questionMarkIndex)),
    query: parseQuery(withoutHash.slice(questionMarkIndex)),
  };
}

function applyLocation(path: string, query: Record<string, string>): void {
  const match: MatchResult | null = matchPath(path);
  if (match === null) {
    router.path = path;
    router.query = query;
    router.routeName = ROUTE_NAME_NOT_FOUND;
    router.parameters = {};
    document.title = "Page not found · Unison";
    return;
  }

  // The guard is a user experience shortcut only. The service still checks the
  // endpoint identity and the room membership on every request.
  if (match.record.requiresIdentity && identity.endpointIdentifier === "") {
    navigate("/rooms/join", { replace: true });
    return;
  }

  router.path = path;
  router.query = query;
  router.routeName = match.record.name;
  router.parameters = match.parameters;
  document.title = `${match.record.title} · Unison`;
}

function handleHashChange(): void {
  const location: LocationParts = readLocationFromHash();
  applyLocation(location.path, location.query);
}

export function navigate(
  target: string,
  options: NavigateOptions = {},
): void {
  const { path, search } = splitTarget(target);
  const targetHash: string = `#${path}${search}`;

  if (options.replace === true) {
    window.history.replaceState(null, "", targetHash);
    applyLocation(path, parseQuery(search));
    return;
  }

  if (window.location.hash === targetHash) {
    // The hash did not change, so no hashchange event will fire.
    applyLocation(path, parseQuery(search));
    return;
  }
  window.location.hash = `${path}${search}`;
}

export function goBack(): void {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  navigate("/", { replace: true });
}

// Build an in-app link target for a room sub page.
export function roomPath(
  roomIdentifier: string,
  subPath: string = "",
): string {
  const normalizedSubPath: string = subPath.startsWith("/")
    ? subPath
    : `/${subPath}`;
  return `/rooms/${roomIdentifier}${normalizedSubPath}`;
}

let isStarted: boolean = false;

// Subscribe to hash changes and apply the initial location. Called once from
// main.ts before the application is mounted.
export function startRouter(): void {
  if (isStarted) {
    return;
  }
  isStarted = true;
  window.addEventListener("hashchange", handleHashChange);

  if (window.location.hash === "") {
    window.history.replaceState(null, "", "#/");
  }
  handleHashChange();
}

// Remove the listener. Used by hot module replacement during development.
export function stopRouter(): void {
  if (!isStarted) {
    return;
  }
  isStarted = false;
  window.removeEventListener("hashchange", handleHashChange);
}

export function currentRoute(): RouteRecord | null {
  return findRouteByName(router.routeName);
}
