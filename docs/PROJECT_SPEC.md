# Project Specification: MASAKRA na Starym Majdanie

## 1. Project Overview
**Name:** MASAKRA na Starym Majdanie  
**Description:** A digital tactical board game simulator where players manage pieces (pawns) and special game objects across a 6x6 grid.  
**Goal:** A multi-client, real-time synchronized game engine with complex movement rules, resource distribution (Sets), automated worker-thread simulations, and phase-based gameplay.

## 2. Tech Stack
- **Frontend Framework:** React 19 (Hooks, Portals, Context)
- **Backend:** Node.js with Express 5
- **Real-time Sync:** Socket.io (rooms + semantic `action:*` events)
- **Simulation Engine:** Node.js Worker Threads (`worker_threads`)
- **Data Visualization:** Recharts
- **Build Tool:** Vite (dev proxy `/api` and `/socket.io` → `127.0.0.1:3001`)
- **i18n:** Five locale JSON files (`pl`, `en`, `cs`, `uk`, `tlh`) via `useTranslation`
- **PDF export:** `html2pdf.js` on the Game Rules SPA
- **Styling:** Vanilla CSS
- **Data Persistence:** Multi-file JSON storage per game session.
- **Containerization:** Docker (multi-stage Alpine build)

## 3. Core Architecture
### 3.1 Multi-Game System
- **Game Isolation:** Each game session is identified by a unique ID in the URL (`/game/{id}`).
- **Data Storage:** Each game has its own directory in `server/games/{id}/` containing:
  - `map.json`: Region coordinates, neighbors, and pawn instances.
  - `players.json`: Player names, points, assigned General band, and game end stats breakdown.
  - `sets.json`: Randomized pawn sets and their power configurations.
  - `state.json`: Current game phase and metadata.
  - `events.json`: Drawn events and remaining event card deck pool.

### 3.2 Real-time Synchronization
- **Dynamic Rebranding:** The game title is fully dynamic and managed in `server/configs/game_config.json`.
- **WebSocket Integration:** Clients join `game:{id}` rooms. Mutations go through `server/socketHandler.js` semantic events (`action:placeSet`, `action:movePawn`, and related handlers) which call `shared/actions/actionService.js`, persist, then broadcast `boardUpdate`.
- **Optimistic Updates:** Frontend updates state immediately for responsiveness, then synchronizes with the server.
- **Relative API URL:** Frontend `SERVER_URL` defaults to `''` so the browser uses the current host (Vite proxy in dev, same origin in Docker). Override with `VITE_SERVER_URL` if needed.

### 3.3 High-Performance Parallel Simulation
- **Worker Thread Pool:** Runs Monte Carlo simulations in parallel across all available CPU cores.
- **Real-Time Job Telemetry:** Progress, games/second throughput, and results are broadcast via Socket.io to the Admin Panel.
- **Statistical Breakdown:** Tracks Herszt performance, 1st vs 2nd match closeness buckets (`0-5`, `6-10`, `11-15`, `>15`), 1st vs 4th blowout spread buckets (`0-20`, `21-40`, `41-60`, `>60`), and 4th-place catch-up General selection choices.

### 3.4 Internationalization
- **Supported codes:** `pl` (default), `en`, `cs`, `uk`, `tlh`. Defined in `src/constants/languages.js`.
- **Persistence:** `localStorage.lang`; language switches via `app_language_change` (no full page reload).
- **UI dictionaries:** `src/locales/{code}.json` loaded eagerly by `src/hooks/useTranslation.js` (fallback `pl` → `en` → key).
- **Game history:** `src/utils/logTranslator.js`. Klingon UI uses `src/utils/piqad.js` (`toPiqad`).
- **Footer:** Five flag buttons only. Do not restore the reverted 110-locale world picker.

## 4. Game Mechanics
### 4.1 Pawn Movement & Range
- **Speed Variable:** Each pawn type has a `speed` parameter (V: 999, W: 2, G: 1, B: 1).
- **Movement Validation:** Orthogonal BFS algorithm calculates reachable regions based on speed. Valid targets are highlighted with green borders.
- **States:** Pawns placed on the board are `ENABLED` by default. `DISABLED` pawns cannot be moved.

### 4.2 Game Objects (Special Pieces)
- **Jakub (Unique):** 
  - Only one instance can exist on the map.
  - **Dynamic Parameters:** Managed via a right-side dashboard (Speed, Depleting Range, Anger per band).
  - **Movement Locking:** Jakub's range decreases per move; he stops when range reaches 0.
  - **Automatic Rampage:** In Jakub Phase, he automatically executes his turns based on pre-defined strategies.
  - **Cascading Tie-Breaker:** Bands grouped by anger tiers (descending), hierarchy-ordered within each tier. Region ties resolved by checking each band's pawn count in cascade order.
  - **Niepochamowany Zwierzęcy Magnetyzm:** When absolute tie persists after all bands checked, all pawns from tied regions are pulled to Jakub's region with a shockwave aura pulse animation.

### 4.3 Sets System
- **Bulk Placement:** Pawn collections (Sets) can be dragged from a sidebar to board regions.
- **Rules:** 
  - Max 5 pawns per set, max 3 bands, and max 6 "Power" (V:3, W:2, G:1, B:1).
  - Can only be placed in empty regions and if pawn pool allows.
  - Can be given to Jakub for 1 point, increasing his anger/range automatically.
- **Ownership:** Sets can be in the "Draw Pile", "Discarded", or held by a specific Player/Jakub.

### 4.4 Phase-Based Gameplay
- **Setup Phase:** Board initialization and set distribution (Manual "DRAW SETS" button).
- **General Phase:** Dedicated phase for players to choose their General/Band (ordered ascending by current points).
- **Player Phase:** Active pawn placement (from hand) and movement. Includes "PASS" mechanism.
- **Jakub Phase:** Automated sequences where Jakub strengthens, hunts pawns, and tracks Świadek Jakuba / Miłosierdzie.
- **Event Phase:** Random event card drawn from deck, modifying board conditions or Jakub parameters.
- **Final Scoring:** Automatic calculation of end-game bonuses (Round 12 final scoring).

## 5. UI & Interaction
### 5.1 Player-Specific Clients
- **Join as Player:** URL parameter `?player={id}` identifies the user.
- **Points Tracker:** Displays all players, their points, general icons, and "PASS" status. Highlighted border for current player.
- **Sidebar:** Closed by default. "SETS" toggle controls the global Draw/Discard panel. Player Hand is always visible if playing as a specific ID.

### 5.2 Responsive Header & Automation
- **Autoplay Modes:**
  - **JAKUB AUTO:** Automates only the Jakub Phase after all players pass.
  - **FULL AUTO:** Automates the entire game cycle.
- **Auto-advance (`autoClickNext`):** Default ON (`localStorage`). After set placement or feeding Jakub, the turn advances immediately. Toggle lives in the Options / Game panel.
- **Deployment Ready:** `server_config.json` for local backend host; production/Docker use relative URLs.

### 5.3 Quick Controls (Keyboard Shortcuts)
- **Shift + Click (Pawn):** Remove pawn from region.
- **Shift + Click (Points/Counters):** Increase value.
- **Ctrl + Click (Points/Counters):** Decrease value.

### 5.4 Mobile view
- **Activation:** `useMobileUi` (`localStorage.uiLayout` = `auto` | `mobile` | `desktop`). Auto uses `max-width: 768px`. Sets `html.mobile-ui`.
- **Chrome:** Compact header, fluid 6×6 board (no wood frame), sticky claimed-player hand, bottom tabs (Players / Jakub / Game / History). In-game footer is hidden; language lives in the Game tab.
- **Input:** Tap to select, tap a highlighted region to place/move. Desktop mouse-drag is unchanged. Action bar: Give to Jakub / Pass / Cancel. Long-press a pawn for status + Remove. Players tab shows +/− on points.
- **Out of scope for v1:** Admin restyle, PWA, mobile touch-drag.

### 5.5 Routes & Chrome
- **Landing:** `/` (`LandingPage.jsx`).
- **Game:** `/game/{id}` with optional `?player={id}`.
- **Rules SPA:** `/docs/game` (`GameRulesPage.jsx`, PDF via `html2pdf.js`). Markdown fallback: `/api/docs/game`.
- **Admin:** `/admin/sets`, `/admin/events`, `/admin/simulate` (not `/admin`).
- **Footer:** Docs links, five language flags, version from `src/constants/version.js`.

## 6. Project Status (Current: v1.20.2)
- **Implemented:**
  - Manual & Automated gameplay, Dockerization, multi-phase logic, refined scoring.
  - i18n for five languages (`pl`, `en`, `cs`, `uk`, `tlh`) including localized game history; Klingon pIqaD.
  - React Game Rules page with matching footer and PDF export.
  - Auto-advance turn after set placement/kablowanie with Options panel toggle (`autoClickNext`, default ON).
  - 2x larger placement points preview popup.
  - Cascading tie-breaker system & Niepochamowany Zwierzęcy Magnetyzm visual effects.
  - Parallel Monte Carlo Simulation Engine with Worker Threads, Socket.io telemetry, closeness/blowout charts, and interactive Recharts dashboard.
  - Event Cards Deck & Set Customization Admin Editors.
  - Vite `/api` + `/socket.io` proxy to `127.0.0.1` for universal Docker/dev connectivity.
- **Next Steps:** Continuous AI tuning and community balance analytics.

## 7. Core File Map (AI Navigation)
### 7.1 Backend (Logic, Services & State)
- **Server Entry:** `server/server.js` (Express server, Scalar docs mount, Socket.io)
- **Socket Actions:** `server/socketHandler.js` (rooms, `action:placeSet`, `action:movePawn`, …)
- **Game Engine:** `server/gameLogic.js` (Phase transitions, move validation, snapshot state)
- **Board/Regions:** `server/boardManager.js` (Map initialization, coordinate logic)
- **Sets/Pawns:** `server/setManager.js` (Pawn generation, Set distribution)
- **Scoring Engine:** `server/scoring/scoring.js`, `shared/scoring/` (Vampire, Werewolf, Ghost, Bardak scoring)
- **Shared Engine:** `shared/constants.js` (game-rule SSOT for server + frontend), `shared/boardGeometry.js`, `shared/actions/actionService.js`, `shared/sharedPlacementManager.js`, `shared/generalSelectionManager.js`, `shared/milosierdzieManager.js`, `shared/statsManager.js`
- **Services:**
  - `server/services/gameService.js` (session helpers)
  - `server/services/serverPlacementManager.js` (server placement)
  - `server/services/simulationService.js` (simulation API helpers)
  - `server/services/simulationJobManager.js` (Worker Thread pool, Socket.io progress broadcasting)
  - `server/services/simulationWorker.js` (Dedicated worker thread simulation runner)
- **Event System:** `server/events/` (`eventEffectManager.js`, `gameEventPhaseManager.js`)
- **API Routes:** `server/routes/` (`games.js`, `sets.js`, `events.js`, `simulation.js`, `config.js`)
- **Persistence:** `server/games/{id}/` (JSON state storage)
- **Master Configs:** `server/configs/` (`game_config.json`, `set_default.json`, `events_default.json`, `events_all.json`)

Jakub AI lives in `src/strategies/jakubStrategy.js`. There is **no** `server/services/aiDecisionService.js`.

### 7.2 Frontend (UI, State & Visualization)
- **Root Entry:** `src/main.jsx`, `src/App.jsx`
- **Global State (Socket):** `src/hooks/useGameState.js`
- **Autoplay/Logic Loop:** `src/hooks/useAutoplay.js` (Handles automated game loop, history logging, and `jakub_phase` ticks)
- **Interaction:** `src/hooks/useGameInteraction.js` (Click handlers, drag-and-drop, `autoClickNext`)
- **i18n:** `src/hooks/useTranslation.js`, `src/constants/languages.js`, `src/locales/{pl,en,cs,uk,tlh}.json`, `src/utils/logTranslator.js`, `src/utils/piqad.js`
- **Constants:** `src/constants/version.js`, `game.js`, `board.js`, `pawnTypes.js`, `constants.js` (`SERVER_URL` relative)
- **Chrome:** `src/components/Footer.jsx`, `GameHeader.jsx`, `LandingPage.jsx`
- **Rules SPA:** `src/components/docs/GameRulesPage.jsx`
- **Placement:** `src/logic/clientPlacementManager.js`
- **Board Components:** `src/components/Board.jsx`, `src/components/Region.jsx`
- **Board Effects & Overlays:** `src/components/board/` (`JakubOverlay.jsx`, `JakubTracksManager.jsx`, `VisualEffectsManager.jsx`)
- **Admin Tools:**
  - `src/components/AdminSimulate.jsx` (`/admin/simulate` — Worker Thread dashboard with 13 interactive charts & telemetry)
  - `src/components/AdminEvents.jsx` (`/admin/events`)
  - `src/components/AdminSets.jsx` (`/admin/sets`)
- **UI Panels:** `src/components/panels/` (PlayersPanel, JakubPanel, HistoryPanel, SetsPanel, EventsPanel, GamePanel, GameTabBody, MobileTabBar, LoadSavesPanel)
- **Styles:** `src/assets/css/` (`base.css`, `layout.css`, `board.css`, `popups.css`, `effects.css`, `mobile.css`, `admin.css`, `landing.css`, `rules.css`) and `src/assets/css/panels/` (one file per in-game panel)
- **Strategy & AI:** `src/strategies/jakubStrategy.js`

### 7.3 Automation & Deployment (`bash/`)
- **Unified Deploy Script:** `bash/deploy.sh` (Multi-mode: local tag build, `latest`, and `network` deploy to `192.168.111.25`)
- **Remote Host Runner:** `bash/deploy_latest.sh` (Direct host-side image pull and runner on server)
- **Grok deploy skill:** `.grok/skills/deploy/SKILL.md` (version bump, tag, local + network images)


## 8. Development Constraints & Standards
- **Vanilla Only:** No external UI libraries (MUI, Tailwind, etc.). Use `src/assets/css/`.
- **JSON Integrity:** Never modify JSON structures in `server/games/` without ensuring the frontend `useGameState.js` can parse them.
- **i18n parity:** New UI keys in all five locale files; no hardcoded Polish in components; do not regenerate 110 locales from `scripts/`.
- **Atomic Commits:** Focus on one phase or one component at a time.
- **Docker First:** All backend changes must be verified to run within the Docker container (Alpine-based).
- **Vite proxy:** Target `127.0.0.1`, not `localhost`. Keep `SERVER_URL` relative unless `VITE_SERVER_URL` is set.

## 9. Documentation System
- **Narrative Context:** Found in `docs/STORY.md`. All UI flavor text and game rules must align with this "Final Raid on Stary Majdan" scenario.
- **API Documentation:** Interactive reference powered by **Scalar** using the OpenAPI 3.0 standard.
  - Spec File: `docs/openapi.json`
  - Endpoint: `/api/docs/api`
  - Static Viewer: `docs/index.html` (Redoc)
- **Game Rules:**
  - Markdown source: `docs/GAME_RULES.md` at `/api/docs/game`
  - Styled SPA: `src/components/docs/GameRulesPage.jsx` at `/docs/game` (PDF export)
- **UI Integration:** Links available in the application `Footer.jsx`.
- **AI Assistant Context & Rules:** `GROK.md` (primary), `GEMINI.md`, deploy skill `.grok/skills/deploy/SKILL.md`.

