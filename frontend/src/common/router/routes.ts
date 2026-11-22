import type { Component } from "svelte";

import LandingPage from "@/pages/Home.svelte";
import RoomCreatePage from "@/pages/entry/Create.svelte";
import RoomJoinPage from "@/pages/entry/Join.svelte";
import SessionRestorePage from "@/pages/entry/Restore.svelte";
import RoomBoardPage from "@/pages/rooms/Board.svelte";
import HistoryPage from "@/pages/rooms/History.svelte";
import AskPage from "@/pages/rooms/Ask.svelte";
import MembersPage from "@/pages/rooms/Members.svelte";
import StatusPage from "@/pages/rooms/Status.svelte";
import OutboxPage from "@/pages/rooms/Outbox.svelte";
import FaultsPage from "@/pages/rooms/Faults.svelte";
import DemoScriptPage from "@/pages/demo/Demo.svelte";
import PlaybackPage from "@/pages/fallback/Fallback.svelte";
import SettingsPage from "@/pages/settings/Settings.svelte";
import ErrorPage from "@/pages/error/Error.svelte";

// The single route table of the application. Paths follow the page design
// document: static paths are declared before the dynamic room path so that
// /rooms/new and /rooms/join are never captured as a room identifier.
export type RouteName =
  | "landing"
  | "room-create"
  | "room-join"
  | "session-restore"
  | "room-board"
  | "history"
  | "ask"
  | "members"
  | "status"
  | "outbox"
  | "faults"
  | "demo-script"
  | "playback"
  | "settings"
  | "error";

export interface RouteRecord {
  // Stable name used by the router and by tests. It never appears in the URL.
  name: RouteName;
  // Path pattern. A segment that starts with a colon is a parameter.
  pattern: string;
  // Browser tab title. All user visible text is English.
  title: string;
  // Route component rendered by RouteView.
  component: Component;
  // Room routes need an endpoint identity; the guard sends visitors to join.
  requiresIdentity: boolean;
}

export const routes: readonly RouteRecord[] = [
  {
    name: "landing",
    pattern: "/",
    title: "Home",
    component: LandingPage,
    requiresIdentity: false,
  },
  {
    name: "room-create",
    pattern: "/rooms/new",
    title: "Create room",
    component: RoomCreatePage,
    requiresIdentity: false,
  },
  {
    name: "room-join",
    pattern: "/rooms/join",
    title: "Join room",
    component: RoomJoinPage,
    requiresIdentity: false,
  },
  {
    name: "session-restore",
    pattern: "/session/restore",
    title: "Restore session",
    component: SessionRestorePage,
    requiresIdentity: false,
  },
  {
    name: "room-board",
    pattern: "/rooms/:roomIdentifier",
    title: "Room",
    component: RoomBoardPage,
    requiresIdentity: true,
  },
  {
    name: "history",
    pattern: "/rooms/:roomIdentifier/history",
    title: "History",
    component: HistoryPage,
    requiresIdentity: true,
  },
  {
    name: "ask",
    pattern: "/rooms/:roomIdentifier/ask",
    title: "Ask",
    component: AskPage,
    requiresIdentity: true,
  },
  {
    name: "members",
    pattern: "/rooms/:roomIdentifier/members",
    title: "Members",
    component: MembersPage,
    requiresIdentity: true,
  },
  {
    name: "status",
    pattern: "/rooms/:roomIdentifier/status",
    title: "Status",
    component: StatusPage,
    requiresIdentity: true,
  },
  {
    name: "outbox",
    pattern: "/rooms/:roomIdentifier/outbox",
    title: "Outbox",
    component: OutboxPage,
    requiresIdentity: true,
  },
  {
    name: "faults",
    pattern: "/rooms/:roomIdentifier/faults",
    title: "Faults",
    component: FaultsPage,
    requiresIdentity: true,
  },
  {
    name: "demo-script",
    pattern: "/demo",
    title: "Demo script",
    component: DemoScriptPage,
    requiresIdentity: false,
  },
  {
    name: "playback",
    pattern: "/fallback",
    title: "Playback",
    component: PlaybackPage,
    requiresIdentity: false,
  },
  {
    name: "settings",
    pattern: "/settings",
    title: "Settings",
    component: SettingsPage,
    requiresIdentity: false,
  },
  {
    name: "error",
    pattern: "/error",
    title: "Error",
    component: ErrorPage,
    requiresIdentity: false,
  },
];

// The route used when no pattern matches the current hash.
export const ROUTE_NAME_NOT_FOUND = "not-found";

export type ResolvedRouteName = RouteName | typeof ROUTE_NAME_NOT_FOUND;

// Look up a route record by its stable name. Returns null for the not-found
// pseudo route, so RouteView can fall back to the error page.
export function findRouteByName(
  routeName: ResolvedRouteName,
): RouteRecord | null {
  if (routeName === ROUTE_NAME_NOT_FOUND) {
    return null;
  }
  for (const route of routes) {
    if (route.name === routeName) {
      return route;
    }
  }
  return null;
}
