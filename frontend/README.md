# Unison · Frontend

Svelte 5 with runes, Vite, Tailwind v4 and shadcn-svelte. The frontend never
talks to the model API, never merges concurrent edits and never orders frames
by a local clock. All of that belongs to the service.

## Requirements

- Node.js 20 or newer.
- npm. The repository is installed with `npm install`; no global tooling is
  required.

## Commands

```bash
npm install        # install dependencies
npm run dev        # development server with hot reload
npm run build      # production bundle in dist/
npm run preview    # serve the production bundle
npm run check      # svelte-check + tsc, must report zero errors
npm run lint       # eslint
npm run format     # prettier
```

The merge gate is `npm run check`: `svelte-check` and `tsc --noEmit` must both
report zero errors. Strict switches are committed in `tsconfig.app.json` and are
never passed on the command line.

## Directory layout

```text
src/
├── assets/                  static images and fonts
├── common/
│   ├── api/                 REST client, SSE client, error code constants
│   ├── components/          shared custom components
│   ├── router/              zero-dependency hash router
│   ├── stores/              shared runes state (*.svelte.ts)
│   └── utils/               pure helpers
├── lib/components/ui/       generated shadcn-svelte components (never edit)
├── pages/                   route pages, grouped by module
├── App.svelte               shell: header, menu and the route outlet
├── app.css                  Tailwind entry and design tokens
└── main.ts                  mount point and router start
```

Only `common/stores/` holds cross-page state. `lib/components/ui` is generated
code: never edit it. Reusable wrappers live in `common/components/`.

## Aliases

| Alias    | Target      |
| -------- | ----------- |
| `@/*`    | `src/*`     |
| `$lib/*` | `src/lib/*` |

Both are configured twice, in `vite.config.ts` for the bundler and in
`tsconfig.app.json` for the type checker. Cross-directory imports must use an
alias; relative paths such as `../../core` are not allowed.

## Routing

The router is written in-house under `src/common/router/`. No routing library
is installed.

| File                | Responsibility                                       |
| ------------------- | ---------------------------------------------------- |
| `routes.ts`         | the single route table: path, name, title, component |
| `router.svelte.ts`  | hash listener, path matching, parameters, navigation |
| `RouteView.svelte`  | renders the matched component, or the error page     |

Routes are hash based: `#/rooms/ROOM-4821/history`. Refresh works without
server rewrites because the browser never sends the hash to the server.

| Path                                  | Page             |
| ------------------------------------- | ---------------- |
| `#/`                                  | Landing          |
| `#/rooms/new`                         | Create room      |
| `#/rooms/join`                        | Join room        |
| `#/session/restore`                   | Restore session  |
| `#/rooms/:roomIdentifier`             | Room board       |
| `#/rooms/:roomIdentifier/history`     | History          |
| `#/rooms/:roomIdentifier/ask`         | Ask              |
| `#/rooms/:roomIdentifier/members`     | Members          |
| `#/rooms/:roomIdentifier/status`      | Status           |
| `#/rooms/:roomIdentifier/outbox`      | Outbox           |
| `#/rooms/:roomIdentifier/faults`      | Faults           |
| `#/demo`                              | Demo script      |
| `#/fallback`                          | Playback         |
| `#/settings`                          | Settings         |
| `#/error`                             | Error            |

### Adding a route

1. Add one record to `routes` in `routes.ts` and one member to `RouteName`.
2. Point `component` at the page file and set `requiresIdentity`.
3. That is all. `RouteView` and the menu pick the route up; unknown paths fall
   back to the error page with the title `Page not found · Unison`.

Static paths are listed before the dynamic room path, so `/rooms/new` and
`/rooms/join` are never captured as room identifiers.

### Reading route state

```ts
import { navigate, router } from "@/common/router/router.svelte";

const roomIdentifier: string = $derived(
  router.parameters["roomIdentifier"] ?? "",
);

navigate(`/rooms/${roomIdentifier}/history`);
```

The router exposes `path`, `query`, `routeName` and `parameters`, plus
`navigate`, `goBack`, `roomPath`, `startRouter` and `stopRouter`. Pages never
read `window.location` directly.

### Route guard

Room routes set `requiresIdentity: true`. Without an endpoint identifier the
router replaces the history entry with `#/rooms/join` and keeps no back entry to
the guarded page. The guard is a convenience only: the service validates the
endpoint identity and the room membership on every request.

During W1, before `POST /api/rooms/join` is wired, the join and create pages
issue a local placeholder identifier so the guard and the reconnect path can be
exercised end to end. Replace `ensureEndpointIdentifier()` with the identifier
returned by the service when the contract stub lands.

## State ownership

| Store      | Owner | Content                                            |
| ---------- | ----- | -------------------------------------------------- |
| `identity` | F1    | endpoint identifier, display name, room, instance   |
| `draft`    | F1    | streaming draft frames and optimistic local edits   |
| `history`  | F1    | confirmed records only, ordered by server version   |
| `outbox`   | F1    | offline actions with their `baseVersion`            |
| `metadata` | F1    | the five badge readings, all from the service       |

F1 defines these stores. F2 and F3 consume them read-only. `draft` and `history`
are never mixed: draft text is displayed, never persisted, and never used for
version decisions.

## Contract notes

- Every REST endpoint returns `ResponseEnvelope<TPayload>` with HTTP 200. Branch
  on the top-level `code` only; never on the HTTP status and never on
  `payload.code`.
- The SSE stream at `GET /api/rooms/:roomIdentifier/stream` is the only endpoint
  that does not use the envelope.
- All comments, log lines and user visible strings are English, in the style of
  the Python standard library.
