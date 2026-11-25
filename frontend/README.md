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
│   ├── api/                 REST client, SSE client, contract guards
│   ├── components/          shared custom components
│   ├── config/              instance candidates and endpoint resolution
│   ├── connection/          room connection manager and its shell host
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

| File               | Responsibility                                       |
| ------------------ | ---------------------------------------------------- |
| `routes.ts`        | the single route table: path, name, title, component |
| `router.svelte.ts` | hash listener, path matching, parameters, navigation |
| `RouteView.svelte` | renders the matched component, or the error page     |

Routes are hash based: `#/rooms/ROOM-4821/history`. Refresh works without
server rewrites because the browser never sends the hash to the server.

| Path                              | Page            |
| --------------------------------- | --------------- |
| `#/`                              | Landing         |
| `#/rooms/new`                     | Create room     |
| `#/rooms/join`                    | Join room       |
| `#/session/restore`               | Restore session |
| `#/rooms/:roomIdentifier`         | Room board      |
| `#/rooms/:roomIdentifier/history` | History         |
| `#/rooms/:roomIdentifier/ask`     | Ask             |
| `#/rooms/:roomIdentifier/members` | Members         |
| `#/rooms/:roomIdentifier/status`  | Status          |
| `#/rooms/:roomIdentifier/outbox`  | Outbox          |
| `#/rooms/:roomIdentifier/faults`  | Faults          |
| `#/demo`                          | Demo script     |
| `#/fallback`                      | Playback        |
| `#/settings`                      | Settings        |
| `#/error`                         | Error           |

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

During W1, before the service is running, the join and create pages offer a
**development-only** "Continue in demo mode" action. It issues a local endpoint
identifier so the guard and the reconnect path can still be exercised. The
action is never rendered in a production build, and the normal path always uses
the identifier issued by `POST /api/rooms/join`.

## Connection lifecycle (M11)

`common/connection/roomConnection.svelte.ts` owns one connection per room. It is
mounted once by `RoomConnectionHost` in the application shell, so moving between
the board, history and status pages never reopens the stream.

1. **Snapshot first.** Every attach, including every reconnect, calls
   `GET /api/rooms/:roomIdentifier/snapshot` before opening the stream. The
   confirmed history is replaced from that snapshot; draft text is always
   discarded, never restored.
2. **Stream second.** `GET /api/rooms/:roomIdentifier/stream` is opened with the
   endpoint identifier and `lastEventIdentifier` set to the snapshot version.
   Named SSE events (`confirm`, `delta`, `interrupt`, `status`, …) are parsed
   and guarded by `parseFrame`; a malformed frame is dropped.
3. **Confirmed version.** `confirm` and `edit-receipt` append only when the
   frame version is newer than the last applied version, so a reconnect cannot
   duplicate a record. Version ordering never uses a local clock.
4. **Automatic reconnect.** A transport error closes the stream and schedules a
   retry with exponential backoff (500 ms doubling to 8 s). Browser `offline`
   moves the state to `offline`; `online` retries immediately.
5. **Instance switching.** Each failed attempt rotates to the next candidate
   instance before retrying. The endpoint identifier is persisted, so the new
   instance recognises the same endpoint, and the snapshot restores the
   history. The badge instance identifier always comes from `GET /api/health`,
   never from the URL.

The exposed state is `phase`, `roomIdentifier`, `instanceIdentifier`,
`instanceBaseUrl`, `attempt`, `lastConfirmedVersion` and `lastError`. The board
shows the phase in English and offers `Reconnect` and `Switch instance` when the
connection is not healthy.

### Instances and the development proxy

Copy `.env.example` to `.env.local` and adjust it:

```bash
# Comma separated absolute instance base URLs. Empty means the page origin.
VITE_INSTANCE_URLS=http://192.168.1.5:3001,http://192.168.1.5:3002

# Backend target of the Vite development proxy (dev server only).
UNISON_BACKEND_URL=http://127.0.0.1:3000
```

With a single instance, leave `VITE_INSTANCE_URLS` empty: the browser calls
`/api` on the page origin and Vite proxies it to `UNISON_BACKEND_URL`.

With several instances, the list must use absolute URLs. Because the browser
then calls another origin directly, the backend instances must return CORS
headers (`Access-Control-Allow-Origin` and the `X-Endpoint-Identifier` request
header) for LAN access, or the frontend must be served by each instance itself.
This is a backend requirement for B1, not something the frontend can work
around.

## State ownership

| Store      | Owner | Content                                           |
| ---------- | ----- | ------------------------------------------------- |
| `identity` | F1    | endpoint identifier, display name, room, instance |
| `draft`    | F1    | streaming draft frames and optimistic local edits |
| `history`  | F1    | confirmed records only, ordered by server version |
| `outbox`   | F1    | offline actions with their `baseVersion`          |
| `metadata` | F1    | the five badge readings, all from the service     |

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
