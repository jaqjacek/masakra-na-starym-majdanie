# Agent instructions — MASAKRA na Starym Majdanie

Single source of truth for every AI agent working in this repository.

**Version:** v1.23.0 (`package.json`, `src/constants/version.js`) · **Branch:** `develop` · **Next work:** refine player AI (strategic keep-3, look-ahead, sim parity, tests).

Talk to the user in **Polish**. Code, commits, tags, identifiers and documentation stay in **English** unless the user asks otherwise.

---

## 1. What this repo is

Digital 4-player tactical board game on a 6×6 grid (Jakub Wędrowycz universe). React 19 + Vite frontend, Express 5 + Socket.io backend, multi-file JSON session persistence, worker-thread Monte Carlo simulations, Docker/Podman deployment.

Players are **Hersztowie**. Unclaimed seats are played by **server-side AI**. Jakub's rampage is a separate AI in `src/strategies/jakubStrategy.js`.

---

## 2. Documentation map

| File | Role |
| :--- | :--- |
| [`AGENTS.md`](AGENTS.md) | **This file — single source of truth for all agents.** |
| [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) | Authoritative architecture, file map, data schemas. Update it when architecture changes. |
| [`docs/PLAYER_AI.md`](docs/PLAYER_AI.md) | Player AI architecture, heuristic, gaps, tests. Read before touching AI, placement, pass or simulation turns. |
| [`docs/GAME_RULES.md`](docs/GAME_RULES.md) | Rulebook (Polish). Styled SPA: `src/components/docs/GameRulesPage.jsx`. |
| [`docs/STATE_MANAGEMENT.md`](docs/STATE_MANAGEMENT.md) | Socket state, autoplay, AI tick. |
| [`docs/RELEASE.md`](docs/RELEASE.md) | Release notes and pre-tag checklist. |
| [`docs/openapi.json`](docs/openapi.json) | OpenAPI 3.0 contract for REST. Update on every route change. |
| [`.grok/skills/deploy/SKILL.md`](.grok/skills/deploy/SKILL.md) | Release/deploy procedure (version bump, tag, local + network images). |
| [`README.md`](README.md) | Human-facing project overview. |

Do not look for `project_structure.md` — it does not exist. Use the navigation map in section 8.

---

## 3. Tech stack

- **Frontend:** React 19 (hooks, portals, context), Vite, Recharts, vanilla CSS.
- **i18n:** `useTranslation` + `src/locales/{pl,en,cs,uk,tlh}.json`; game history via `src/utils/logTranslator.js`; Klingon (`tlh`) rendered with `toPiqad` in `src/utils/piqad.js`.
- **PDF:** `html2pdf.js` for the Game Rules export on `/docs/game`.
- **Backend:** Node.js v20+, Express 5, Socket.io (real-time sync + semantic `action:*` events).
- **Simulations:** Node.js Worker Threads (`worker_threads`) for parallel Monte Carlo.
- **Persistence:** multi-file JSON per game session in `server/games/{id}/`.
- **Dev proxy:** Vite proxies `/api` and `/socket.io` to `127.0.0.1:3001` (see `vite.config.js`).
- **Containers:** Docker & Podman, multi-stage Alpine build.

---

## 4. Hard constraints

1. **Vanilla CSS only.** Never install Tailwind, MUI, Bootstrap or any external CSS component library. Styles live in `src/assets/css/` (`base.css`, `layout.css`, `board.css`, `popups.css`, `effects.css`, `mobile.css`, `admin.css`, `landing.css`, `rules.css`, plus `panels/*.css`).
2. **JSON integrity.** Never change session JSON structures in `server/games/{id}/` without confirming both `server/gameLogic.js` and `src/hooks/useGameState.js` can parse them. Player IDs may be numbers or strings — compare defensively (`String(id)` / `parseInt` + `isNaN`).
3. **API docs sync.** Always update `docs/openapi.json` when adding, modifying or removing REST endpoints in `server/routes/`. The Scalar UI at `/api/docs/api` depends on it.
4. **i18n — five locales only:** `pl`, `en`, `cs`, `uk`, `tlh`. UI copy goes through `t()`; never hardcode Polish (or any language) in panels, header, footer or admin. New keys must exist in **all five** files (key parity). Footer shows five flag buttons — do **not** restore the 110-language picker and do **not** run `scripts/` locale generators during normal work.
5. **Server URL / proxy.** Keep `SERVER_URL` in `src/constants/constants.js` as `''` (relative) so Docker and LAN hosts work; override only via `VITE_SERVER_URL`. Vite proxy targets `127.0.0.1`, never `localhost` (IPv6 `localhost` breaks the backend).
6. **Shell.** Always use **Bash** for scripts and automation (`bash/*.sh`). Never write PowerShell (`.ps1`).
7. **Docker / Podman first.** Backend changes must build and run in the container. `Dockerfile` Stage 2 must keep `COPY src/ ./src/` because backend/shared code imports `src/strategies/jakubStrategy.js`. Keep `server.listen(PORT)` without `'0.0.0.0'` to preserve IPv6 dual-stack.
8. **Game-rule numbers** live in `shared/constants.js`; `server/constants.js` re-exports them; `server/configs/game_config.json` overrides at runtime.
9. **No invented services.** There is **no** `server/services/aiDecisionService.js`. Player AI is `server/services/playerAiService.js`; Jakub AI is `src/strategies/jakubStrategy.js`.
10. **Do not search the whole codebase with broad greps** for routine work — use the navigation map (section 8) and `docs/PROJECT_SPEC.md`.
11. **Keep `docs/PROJECT_SPEC.md` current** whenever architectural paths, core components, schemas or deployment paths change.

---

## 5. Dealing and pass rules (shipped in v1.21.0 — do not revert)

**Hand dealing**

- Game start: each player receives **5** sets (`initialSetsPerPlayer` / `INITIAL_SETS_PER_PLAYER`).
- Round 1 **DRAW SETS** adds **no** player sets (Jakub still draws 2).
- From round 2: each player is dealt **+3** sets (append to hand, **not** topped up to 3). A player who kept 3 can start the round with 6.

**Pass / kablowanie**

- On pass, randomly keep at most **3** sets (`MAX_SETS_KEPT_ON_PASS`).
- Excess sets go to Jakub as **donos** (fury and range update immediately, **0 points**).
- Voluntary mid-turn **kablowanie** still awards **+1** point (`KABLOWANIE_POINTS`).
- Live AI compares place / kablowanie / pass; pass discard is still random keep-3.

**Other shipped in v1.21.0**

- Spectator all-AI record/replay (`server/services/spectatorReplayService.js`, `src/hooks/useSpectatorPlayback.js`).
- `App.jsx` split under 1000 LOC; board visual effects hook; stats category `rambo` → `placement`.
- `rules_flow_p3_desc` matches the pass rule in all five locales. `rules_flow_p1_desc` still describes the old refill-to-3 dealing rule — fix it when next touching i18n.

---

## 6. Player AI

Canonical server loop: **`server/services/playerAiService.js`**.

After every socket action, `server/socketHandler.js` calls `persistThenAi` → `enqueueGame` → `revealAfterChange` (max 200 steps). Unclaimed players act immediately; claimed IDs live in `state.manualPlayers`. If a human is watching, each AI place, pass and kablowanie is emitted separately and held for 5× the current autoplay tick. All-AI games are not slowed.

Pacing rules (none may block the queue):

- Simulation has no UI wait.
- A claimed human gets the 5× reveal.
- An admin watching an AI-only game is paced only on the client.
- `POST /event-phase` runs once per round (queued, no rewind).
- Client Jakub kill steps wait 2× the autoplay tick, capped at 1 s. Other floats use 1.5 s.

**Spectator replay** (separate from the live reveal): `POST /api/map/:gameId/spectator/start` records a full all-AI game from a fresh setup into `server/games/{id}/replay.json`; the client plays frames back at 2× tick (max 1 s). The button appears only at setup/round 1 and again at End Game. Recording does not sleep. A saved replay is read-only — socket mutations are rejected, and playback ignores socket echoes.

| Decision | Implementation | Quality |
| :--- | :--- | :--- |
| General pick | `shared/generalSelectionManager.js` `chooseGeneral` | Weighted hand + anger + board presence. No look-ahead. |
| Place vs pass | `SharedPlacementManager.findBestPlacement` then `aiPlaceOrPass` | One-ply greedy. Place if `utilityPlace >= 0`, else pass. |
| Where / which set | Same scorer: `netScore - threatPenalty + endGameValue * (currentRound / 12)` | Place if best score ≥ 0. Endgame matches final scoring. |
| Pass excess | `selectExcessSetsOnPass` | Random keep-3. No strategic discard. |
| Kablowanie | `choosePlayerAction` vs place and pass | +1 minus own-race and range cost. Does not pass the seat. |
| Jakub phase | `src/strategies/jakubStrategy.js` | Separate, mature. |

Client `useAutoplay` **yields** on `general_phase` / `player_phase` so the server AI can run. FULL AUTO still drives setup, Jakub ticks and event/round transitions.

Simulations (`server/services/simulationService.js`) **duplicate** the place/pass loop — they call `findBestPlacement` + `executePass` themselves. Keep them in sync with live AI, or later route them through `runPlayerAi`.

**Next priorities**

1. Strategic pass discard (which 3 to keep), not random.
2. Look-ahead / opponent leakage: the scorer subtracts opponent placement points but does not simulate Jakub's next hunt.
3. Tests: placement + player-AI coverage for place vs pass, kablowanie, keep-3, general choice.
4. Optional: one simulation path that calls `playerAiService.runPlayerAi` so live games and Monte Carlo share a brain.

Stay inside existing files first. Add a module only if a strategy object would otherwise bloat `SharedPlacementManager`.

---

## 7. Game cycle and bands (quick reference)

**Phases**

1. **Setup:** distribute sets to draw piles and players.
2. **General Phase:** reverse-point order (lowest score chooses first).
3. **Player Phase:** place a set, kablowanie (+1), or pass. Pass keeps ≤3; excess to Jakub for **0 points**. `autoClickNext` (default ON) advances after place/kablowanie. Unclaimed players are moved by `playerAiService`.
4. **Jakub Phase:** automated rampage — consumes sets, depletes range, chases bands by anger tier.
5. **Event Phase:** random event card modifies board or parameters.
6. **Final Scoring:** round-12 bonuses.

**Bands**

- **Vampires (V):** speed `999` (teleport); score highest near Jakub.
- **Werewolves (W):** speed `2`; pack hunters (adjacent werewolves + Jakub proximity).
- **Ghosts (G):** speed `1`; solitary, score along edges far from Jakub.
- **Bardaks (B):** speed `1`; high-power meat shields.
- **Jakub (unique):** hunts target bands, resolves ties by band hierarchy; absolute ties trigger **Niepochamowany Zwierzęcy Magnetyzm** (shockwave pull).

---

## 8. Fast navigation map

### Routing (SPA in `src/App.jsx`)

| Path | Surface |
| :--- | :--- |
| `/` | Landing page |
| `/game/{id}` | Live board (`?player={id}` for a specific client) |
| `/docs/game` | React rulebook (`GameRulesPage` + PDF export) |
| `/api/docs/game` | Raw markdown `docs/GAME_RULES.md` |
| `/api/docs/api` | Scalar OpenAPI UI |
| `/admin/sets` | Sets editor |
| `/admin/events` | Events editor |
| `/admin/simulate` | Monte Carlo dashboard |

### Frontend (`src/`)

| File / directory | Purpose |
| :--- | :--- |
| `src/App.jsx` | App shell, phase router, global action handlers |
| `src/hooks/useGameState.js` | WebSocket state sync, optimistic updates, session management |
| `src/hooks/useMobileUi.js` | Auto/mobile/desktop layout (`html.mobile-ui`) |
| `src/hooks/useBoardVisualEffects.js` | Board floats/explosions/spectator banner from state changes |
| `src/hooks/useSpectatorPlayback.js` | Client playback of a saved all-AI replay |
| `src/hooks/useAutoplay.js` | Automation for `JAKUB AUTO` and `FULL AUTO` |
| `src/hooks/useGameInteraction.js` | Board clicks, drag-and-drop, pawn placement (`autoClickNext`) |
| `src/hooks/useTranslation.js` | Locale load, `app_language_change`, fallback `pl` → `en` |
| `src/constants/languages.js` | Supported codes: `pl`, `en`, `cs`, `uk`, `tlh` |
| `src/constants/version.js` | Footer tag/branch/hash/build time |
| `src/constants/{game,board,pawnTypes,constants}.js` | UI state, pawn icons, `SERVER_URL`; game numbers re-exported from `shared/constants.js` |
| `src/locales/{pl,en,cs,uk,tlh}.json` | UI dictionaries |
| `src/utils/logTranslator.js` | Localized game history lines |
| `src/utils/piqad.js` | Klingon pIqaD transliteration |
| `src/logic/clientPlacementManager.js` | Client-side set/pawn placement rules |
| `src/components/Footer.jsx` | Docs links, five language flags, version badge |
| `src/components/GameHeader.jsx` | Top bar / phase controls |
| `src/components/LandingPage.jsx` | Session picker landing |
| `src/components/docs/GameRulesPage.jsx` | Styled rules + `html2pdf` export |
| `src/components/Board.jsx` | 6×6 grid layout and region rendering |
| `src/components/board/` | `JakubOverlay`, `JakubTracksManager`, `VisualEffectsManager`, `SetGhostPointsPopup`, `SpectatorActionPopup`, `AutoplayEventPopup`, `SetupSummary`, `GeneralsPoolPicker` |
| `src/components/modals/` | `EndGameModal`, `ScoringRulesModal` |
| `src/components/panels/` | `PlayersPanel`, `JakubPanel`, `SetsPanel`, `EventsPanel`, `HistoryPanel`, `GamePanel`, `LoadSavesPanel`, `MobileActionBar` |
| `src/components/AdminSimulate.jsx` | Multi-core simulation dashboard (13+ Recharts, `/admin/simulate`) |
| `src/components/AdminEvents.jsx` | Event deck editor (`/admin/events`) |
| `src/components/AdminSets.jsx` | Pawn set balance editor (`/admin/sets`) |
| `src/strategies/jakubStrategy.js` | Jakub AI decision tree, rampage, anger modifiers |

### Backend (`server/`)

| File / directory | Purpose |
| :--- | :--- |
| `server/server.js` | Express server, Socket.io mount, Scalar docs, static SPA routing |
| `server/socketHandler.js` | Rooms + semantic actions (`action:placeSet`, `action:movePawn`, …) |
| `server/gameLogic.js` | Phase transitions, board init, move validation |
| `server/boardManager.js` | 6×6 coordinate math, BFS distance, neighbours |
| `server/setManager.js` | Pawn set generation and distribution |
| `server/routes/` | REST: `games.js`, `sets.js`, `events.js`, `simulation.js`, `config.js` |
| `server/services/gameService.js` | Session CRUD/persistence; deals 5 sets at create |
| `server/services/playerAiService.js` | **Live player AI** — `runPlayerAi` / `afterGameChange`; unclaimed seats only (`manualPlayers`) |
| `server/services/spectatorReplayService.js` | Records all-AI replay (`replay.json`) for spectator mode |
| `server/services/serverPlacementManager.js` | Thin wrapper over `SharedPlacementManager` (find/execute/pass) |
| `server/services/simulationService.js` | Monte Carlo runners (place/pass duplicated vs live AI) |
| `server/services/simulationJobManager.js` | Worker-thread pool + Socket telemetry |
| `server/services/simulationWorker.js` | Monte Carlo worker runner |
| `server/configs/` | `game_config.json`, `set_default.json`, `events_all.json` |
| `server/games/{id}/` | Per-game JSON storage (`map.json`, `players.json`, `state.json`, …) |

Scoring calculators live in `shared/scoring/` (`scoring.js`, `vampireScoring.js`, `werewolfScoring.js`, `ghostScoring.js`, `bardakScoring.js`). There is no `server/scoring/` directory.

### Shared (`shared/`)

| File | Purpose |
| :--- | :--- |
| `shared/constants.js` | Single source of truth for game numbers (races, rounds, hands, Jakub, scoring, pawn pools, `AI_*` weights, history caps, autoplay speeds); `server/constants.js` re-exports it |
| `shared/boardGeometry.js` | Shared BFS range and Chebyshev distance |
| `shared/actions/actionService.js` | Canonical handlers for socket/REST actions |
| `shared/sharedPlacementManager.js` | Placement heuristic (`findBestPlacement`) + pass trim (`selectExcessSetsOnPass`) |
| `shared/generalSelectionManager.js` | AI/autoplay general pick (`chooseGeneral`) |
| `shared/milosierdzieManager.js` | Świadek Jakuba / Miłosierdzie |
| `shared/statsManager.js` | End-game/simulation stats |
| `shared/scoring/` | Scoring calculators used by UI, server and workers |

---

## 9. Commands and deployment

```bash
npm install --legacy-peer-deps

npm run server            # Express on http://localhost:3001
npm run dev               # Vite on http://localhost:5173
npm test                  # node --test tests/*.test.js
npm run build             # vite build
npm run lint              # eslint .
npm run simulate:parallel # CLI parallel Monte Carlo

./bash/deploy.sh          # local container on http://localhost:7777
./bash/deploy.sh latest   # local build tagged with version + :latest
./bash/deploy.sh network  # build, tag :latest, push to registry, deploy via SSH
./bash/deploy.sh --tag v1.23.0 --port 8080 --skip-run
```

Release workflow: follow `.grok/skills/deploy/SKILL.md` (or `/deploy`). Do not invent a second release path.

---

## 10. Known gotchas

1. Do not remove `COPY src/ ./src/` from `Dockerfile` — backend/shared code imports `src/strategies/jakubStrategy.js`.
2. Do not use `server.listen(PORT, '0.0.0.0')` — use `server.listen(PORT)` to keep IPv6 dual-stack.
3. Do not invent `server/services/aiDecisionService.js` — it does not exist.
4. Do not point the Vite proxy at `localhost` — use `127.0.0.1`.
5. Do not reintroduce 110 generated locales; keep key parity across the five JSON dictionaries.
6. Keep hand/pass rules from section 5 (5 starting sets, +3 from round 2, pass keep-3 with 0 points).
7. Update `docs/PROJECT_SPEC.md` for architecture changes and `docs/openapi.json` for REST changes.
8. `tests/` is tracked; `tests/*` is gitignored for scratch output — do not commit generated simulation artefacts.
