# GROK Instructions & Project Context

> **Welcome Grok!** This document provides the essential architecture, constraints, file map, and operational rules for the **MASAKRA na Starym Majdanie** codebase. Read this first to get full context instantly. Current release: **v1.20.1**.

---

## 1. Single Source of Truth
- **Authoritative Technical Spec:** [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) – contains complete architecture, file mappings, and data schemas. **Always consult this first.**
- **Game Rules & Mechanics:** [`docs/GAME_RULES.md`](docs/GAME_RULES.md) – rulebook and scoring mechanics (markdown). Styled SPA: [`src/components/docs/GameRulesPage.jsx`](src/components/docs/GameRulesPage.jsx).
- **REST API Specification:** [`docs/openapi.json`](docs/openapi.json) – OpenAPI 3.0 contract. Update this whenever changing REST endpoints.
- **Release skill:** [`.grok/skills/deploy/SKILL.md`](.grok/skills/deploy/SKILL.md) – version bump, tag, local + network container deploy.

---

## 2. Tech Stack & Core Technologies
- **Frontend:** React 19 (Hooks, Portals, Context), Vite, Recharts, Vanilla CSS.
- **i18n:** `useTranslation` + `src/locales/{pl,en,cs,uk,tlh}.json`. Game history via `src/utils/logTranslator.js`. Klingon (`tlh`) rendered with `toPiqad` in `src/utils/piqad.js`.
- **PDF:** `html2pdf.js` for Game Rules export on `/docs/game`.
- **Backend:** Node.js (v20+), Express 5, Socket.io (WebSocket real-time sync + semantic `action:*` events).
- **Simulation Engine:** Node.js Worker Threads (`worker_threads`) for parallel Monte Carlo simulations.
- **Persistence:** Multi-file JSON storage per game session (`server/games/{id}/`).
- **Dev proxy:** Vite proxies `/api` and `/socket.io` to `127.0.0.1:3001` (see `vite.config.js`).
- **Containerization:** Docker & Podman (multi-stage Alpine build).

---

## 3. Strict Constraints & Mandatory Guidelines

1. **Styling – Vanilla CSS Only:**
   - **DO NOT** install or use Tailwind CSS, MUI, Bootstrap, or other external CSS component libraries.
   - All styles reside in `src/assets/css/` (`base.css`, `layout.css`, `board.css`, `popups.css`, `effects.css`, `mobile.css`, `admin.css`, `landing.css`, `rules.css`, plus `panels/*.css` next to each in-game panel).

2. **JSON Integrity & State Compatibility:**
   - Never change JSON state structures in `server/games/{id}/` without ensuring both `server/gameLogic.js` and frontend `src/hooks/useGameState.js` can parse them.
   - Player IDs may be numeric or strings; handle ID conversions defensively (`parseInt(id)` / `isNaN` checks).

3. **API Documentation Synchronization:**
   - Always update `docs/openapi.json` whenever adding, modifying, or removing REST API endpoints in `server/routes/`. The interactive docs at `/api/docs/api` (Scalar) depend directly on this file.

4. **i18n – Five Locales Only:**
   - UI copy goes through `t()` from `src/hooks/useTranslation.js`. Do not hardcode Polish (or any language) in panels, footer, header, or admin.
   - Game history strings go through `src/utils/logTranslator.js`.
   - New translation keys must be added to **all five** files: `pl.json`, `en.json`, `cs.json`, `uk.json`, `tlh.json` (key parity).
   - Klingon uses `toPiqad` in `src/utils/piqad.js` when `lang === 'tlh'`.
   - Footer language UI is **five flag buttons**, not a world-language search picker. Do **not** restore the 110-locale experiment or regenerate bulk locales from `scripts/` during normal feature work.

5. **Server URL & Vite Proxy:**
   - Keep `SERVER_URL` in `src/constants/constants.js` as `''` (relative) so Docker and LAN hosts work. Override only via `VITE_SERVER_URL`.
   - Vite proxy targets `127.0.0.1`, not `localhost` (IPv6 `localhost` breaks the Node backend).

6. **Shell & Automation:**
   - Always use **Bash** for scripts and commands (`bash/deploy.sh`, `bash/*.sh`).
   - Never write Windows PowerShell scripts (`.ps1`).

7. **Docker / Podman First:**
   - All backend changes must build and run inside the Docker container.
   - In `Dockerfile` Stage 2, keep `COPY src/ ./src/` (required because backend/shared logic imports strategies from `src/strategies/`).
   - In `server/server.js`, keep `server.listen(PORT, ...)` in dual-stack mode (do not hardcode `'0.0.0.0'` which breaks IPv6 `localhost` resolution).

---

## 4. Fast AI Navigation Map

### Routing (SPA in `src/App.jsx`)
| Path | Surface |
| :--- | :--- |
| `/` | Landing page |
| `/game/{id}` | Live game board (`?player={id}` for a specific client) |
| `/docs/game` | React rulebook (`GameRulesPage` + PDF export) |
| `/api/docs/game` | Raw markdown `docs/GAME_RULES.md` |
| `/api/docs/api` | Scalar OpenAPI UI |
| `/admin/sets` | Sets editor |
| `/admin/events` | Events editor |
| `/admin/simulate` | Monte Carlo dashboard |

### Frontend (`src/`)
| Directory / File | Purpose |
| :--- | :--- |
| `src/App.jsx` | Main application shell, phase router, global action handlers |
| `src/hooks/useGameState.js` | WebSocket state sync, optimistic updates, session management |
| `src/hooks/useMobileUi.js` | Auto/Mobile/Desktop layout mode (`html.mobile-ui`) |
| `src/hooks/useAutoplay.js` | Automation loop for Jakub phase (`JAKUB AUTO`) and full game (`FULL AUTO`) |
| `src/hooks/useGameInteraction.js` | Board click handlers, drag-and-drop, pawn placement (`autoClickNext`) |
| `src/hooks/useTranslation.js` | Locale load, `app_language_change` event, fallback `pl` → `en` |
| `src/constants/languages.js` | Supported codes: `pl`, `en`, `cs`, `uk`, `tlh` |
| `src/constants/version.js` | Footer tag / branch / hash / build time |
| `src/constants/game.js`, `board.js`, `pawnTypes.js`, `constants.js` | UI state, pawn icons, `SERVER_URL`; game-rule numbers re-exported from `shared/constants.js` |
| `src/locales/{pl,en,cs,uk,tlh}.json` | UI dictionaries |
| `src/utils/logTranslator.js` | Localized game history lines |
| `src/utils/piqad.js` | Klingon pIqaD transliteration |
| `src/logic/clientPlacementManager.js` | Client-side set/pawn placement rules |
| `src/components/Footer.jsx` | Docs links, five language flags, version badge |
| `src/components/GameHeader.jsx` | Top bar / phase controls |
| `src/components/LandingPage.jsx` | Session picker landing |
| `src/components/docs/GameRulesPage.jsx` | Styled rules + `html2pdf` export |
| `src/components/Board.jsx` | 6x6 board grid layout and region rendering |
| `src/components/board/` | Overlays: `JakubOverlay.jsx`, `JakubTracksManager.jsx`, `VisualEffectsManager.jsx` |
| `src/components/panels/` | `PlayersPanel`, `JakubPanel`, `SetsPanel`, `EventsPanel`, `HistoryPanel`, `GamePanel`, `LoadSavesPanel` |
| `src/components/AdminSimulate.jsx` | Multi-core simulation dashboard with 13+ Recharts (`/admin/simulate`) |
| `src/components/AdminEvents.jsx` | Event card deck editor (`/admin/events`) |
| `src/components/AdminSets.jsx` | Pawn set balance editor (`/admin/sets`) |
| `src/strategies/jakubStrategy.js` | Jakub AI turn decision tree, rampage execution, anger modifiers |

### Backend (`server/`)
| Directory / File | Purpose |
| :--- | :--- |
| `server/server.js` | Express server, Socket.io mount, Scalar API docs, static SPA routing |
| `server/socketHandler.js` | Rooms + semantic actions (`action:placeSet`, `action:movePawn`, …) |
| `server/gameLogic.js` | Phase transitions, board state initialization, move validation |
| `server/boardManager.js` | Board 6x6 coordinate math, BFS distance calculation, neighbor mapping |
| `server/setManager.js` | Pawn sets generation and distribution logic |
| `server/routes/` | REST routes: `games.js`, `sets.js`, `events.js`, `simulation.js`, `config.js` |
| `server/services/gameService.js` | Game session CRUD / persistence helpers |
| `server/services/serverPlacementManager.js` | Server-side placement validation |
| `server/services/simulationService.js` | Simulation job API helpers |
| `server/services/simulationJobManager.js` | Multi-core Worker Thread pool management & Socket telemetry |
| `server/services/simulationWorker.js` | Monte Carlo game simulation worker runner |
| `server/scoring/` & `shared/scoring/` | Band-specific scoring calculators (`Vampire`, `Werewolf`, `Ghost`, `Bardak`) |
| `server/configs/` | Master configs: `game_config.json`, `set_default.json`, `events_all.json` |
| `server/games/{id}/` | Per-game persistent JSON storage (`map.json`, `players.json`, `state.json`, etc.) |

There is **no** `server/services/aiDecisionService.js`. Jakub decisions live in `src/strategies/jakubStrategy.js`.

### Shared (`shared/`)
| Directory / File | Purpose |
| :--- | :--- |
| `shared/constants.js` | Single source of truth for game-rule numbers (races, rounds, hands, Jakub, scoring, pawn pools). `server/constants.js` re-exports this file. |
| `shared/boardGeometry.js` | Shared BFS range and Chebyshev distance |
| `shared/actions/actionService.js` | Canonical handlers for socket/REST game actions |
| `shared/sharedPlacementManager.js` | Placement rules shared by client and server |
| `shared/generalSelectionManager.js` | General/band catch-up selection order |
| `shared/milosierdzieManager.js` | Świadek Jakuba / Miłosierdzie |
| `shared/statsManager.js` | End-game / simulation stats (e.g. general selection tracking) |
| `shared/scoring/` | Scoring calculators used by UI, server, and workers |

---

## 5. Game Rules & AI Quick Reference

### Game Cycle & Phases
1. **Setup Phase:** Distribute sets to draw piles and players.
2. **General Phase:** Reverse-point order selection of Band Generals (lowest points chooses first).
3. **Player Phase:** Active pawn placement from hand / bulk Sets, passing turns. Optional `autoClickNext` (default ON) advances the turn after set placement or feeding Jakub.
4. **Jakub Phase:** Automated AI rampage. Jakub consumes Sets, depletes range, chases bands based on anger tiers.
5. **Event Phase:** Random event drawn from deck modifying board or parameters.
6. **Final Scoring:** Round 12 scoring bonuses calculated.

### Band Characteristics
- **Vampires (V):** Speed `999` (teleport). Max points near Jakub.
- **Werewolves (W):** Speed `2`. Pack hunters (points for adjacent Werewolves and Jakub).
- **Ghosts (G):** Speed `1`. Solitary (points along board edges, far from Jakub).
- **Bardaks (B):** Speed `1`. High power meat-shields.
- **Jakub (Unique):** Slay target bands. Resolves ties hierarchically; absolute ties trigger **Niepochamowany Zwierzęcy Magnetyzm** (shockwave pull).

---

## 6. Build & Deployment Commands

```bash
# 1. Local Development
npm run dev               # Start Vite frontend (http://localhost:5173)
npm run server            # Start Express backend (http://localhost:3001)

# 2. Testing & Simulations
npm test                  # Run Node.js unit tests
npm run simulate:parallel # Run CLI parallel Monte Carlo simulation

# 3. Docker / Podman Unified Deployment
./bash/deploy.sh          # Local build (current version tag) -> runs on http://localhost:7777
./bash/deploy.sh latest   # Local build with version tag AND :latest tag
./bash/deploy.sh network  # Build, tag :latest, push to 192.168.111.25 registry, deploy via SSH

# 4. Optional Deploy Flags
./bash/deploy.sh --tag v1.20.0   # Custom tag
./bash/deploy.sh --port 8080     # Custom port
./bash/deploy.sh --skip-run      # Build only, don't run container locally
```

Release workflow (version files, tag, local + network images): follow `.grok/skills/deploy/SKILL.md`.

---

## 7. Known Gotchas & Pitfalls for AI Assistants
1. **Do not remove `COPY src/ ./src/` from `Dockerfile`** – backend `shared/actions/actionService.js` references `src/strategies/jakubStrategy.js`.
2. **Do not use `server.listen(PORT, '0.0.0.0')`** – use `server.listen(PORT)` to preserve IPv6 (`localhost`) dual-stack support.
3. **Do not invent `server/services/aiDecisionService.js`** – it does not exist. Use `src/strategies/jakubStrategy.js`.
4. **Do not point Vite proxy at `localhost`** – use `127.0.0.1` as in `vite.config.js`.
5. **Do not search the whole codebase with broad greps** – use the Fast Navigation Map above and `docs/PROJECT_SPEC.md`.
6. **Always update `docs/PROJECT_SPEC.md`** if adding new architectural components, schemas, or deployment paths.
7. **Keep locale key parity** across the five JSON dictionaries; do not reintroduce 110 generated locales.
