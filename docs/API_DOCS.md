# MASAKRA na Starym Majdanie REST API

**Status:** v1.23.0. Authoritative contract: [`openapi.json`](openapi.json) (Scalar UI at `/api/docs/api`).

Base URL: `http://<host>:<port>/api`. Content-Type: `application/json`.

Live game mutations go through **Socket.io**, not REST. After every action the server runs **player AI** (`playerAiService.afterGameChange`) for unclaimed seats, then emits `boardUpdate`.

---

## REST

### System
- `GET /ping` — health; returns `pong`.

### Config (`server/routes/config.js`)
- `GET /config` — global server config.
- `POST /config` — update (e.g. `defaultSetName`).
- `GET /config/title` — dynamic game title.

### Games / map (`server/routes/games.js`, mounted at `/api/map`)
- `GET /map/next-id` — next free numeric game ID.
- `POST /map/new` — create a game (optional `set` in body or query); returns `{ id, state }`.
- `GET /map/:gameId` — full session state (creates if missing).
- `POST /map/:gameId` — overwrite state (admin/sync).
- `POST /map/init/:gameId` — initialize with optional `?set=`.
- `POST /map/:gameId/spectator/start` — record an all-AI replay (setup of round 1 only); returns the existing replay if one exists. While a replay exists, manual socket actions are rejected.
- `GET /map/:gameId/replay` — read the saved replay (`server/games/{id}/replay.json`).
- Snapshots, event-phase, and related helpers live on the same router. See OpenAPI.

### Sets (`server/routes/sets.js`)
- `GET /sets` — list set files.
- `GET /sets/details/:setName` — one set JSON.
- `POST /sets/generate` — generate and persist.
- `POST /sets/generate/transient` — generate without writing disk.

### Events (`server/routes/events.js`)
- `GET /events` — event list names.
- `GET /events/all` — master `events_all.json`.
- CRUD for named event decks — see OpenAPI.

### Simulation (`server/routes/simulation.js`)
- `POST /simulate/job` — parallel worker-thread job (`count`, `sets`, `game`, `events`).
- `GET /simulate/job/:jobId` — progress / report.
- `POST /simulate/detailed` — one detailed game history.
- `POST /simulate/full` — multipart full sim.
- Legacy `POST /simulate/` and `/simulate/batch` may still exist; prefer `/job` for the admin dashboard.

Dangerous admin wipe: check OpenAPI before calling any `DELETE` on games.

---

## Socket.io (`server/socketHandler.js`)

Client joins `game:{id}`. Handshake query `gameId` and/or event `joinGame({ gameId, playerId })`. Claiming a seat adds the id to `state.manualPlayers`.

| Event | Purpose |
| :--- | :--- |
| `action:claimPlayer` | Mark seat as human |
| `action:placeSet` | Place a held set on a region |
| `action:movePawn` | Move / drop a pawn |
| `action:selectGeneral` | Herszt pick |
| `action:kablowanieSet` | Give set to Jakub (**+1** point) |
| `action:passTurn` | Pass; keep ≤3, excess to Jakub **0 points** |
| `action:drawSets` | Setup draw (round 1: Jakub only; round 2+: +3 per player) |
| `action:syncState` | Optimistic client dump (rejected if stale via `stateRecency`) |

Server → client: `boardUpdate` with full state. During player-AI turns the state carries `spectatorAction` (one beat per AI move: `type` = `place` / `kablowanie` / `pass` / `general`, `playerId`, `regionId` + `scores` for placements, `revealId`, `revealMs`); human viewers see it held for `PLAYER_AI_REVEAL_TICKS` × the current autoplay tick.

Handlers call `shared/actions/actionService.js`, then `persistThenAi`.
