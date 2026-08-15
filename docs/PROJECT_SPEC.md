# Project Specification: MASAKRA na Starym Majdanie

## 1. Project Overview
**Name:** MASAKRA na Starym Majdanie  
**Description:** A digital tactical board game simulator where players manage pieces (pawns) and special game objects across a 6x6 grid.  
**Goal:** A multi-client, real-time synchronized game engine with complex movement rules, resource distribution (Sets), automated worker-thread simulations, and phase-based gameplay.

## 2. Tech Stack
- **Frontend Framework:** React 19 (Hooks, Portals, Context)
- **Backend:** Node.js with Express 5
- **Real-time Sync:** Socket.io
- **Simulation Engine:** Node.js Worker Threads (`worker_threads`)
- **Data Visualization:** Recharts
- **Build Tool:** Vite
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
- **WebSocket Integration:** Any action made by one client (placing pawns, moving Jakub, changing points, triggering events) is instantly broadcast to all other clients in the same game room.
- **Optimistic Updates:** Frontend updates state immediately for responsiveness, then synchronizes with the server.

### 3.3 High-Performance Parallel Simulation
- **Worker Thread Pool:** Runs Monte Carlo simulations in parallel across all available CPU cores.
- **Real-Time Job Telemetry:** Progress, games/second throughput, and results are broadcast via Socket.io to the Admin Panel.
- **Statistical Breakdown:** Tracks Herszt performance, 1st vs 2nd match closeness buckets (`0-5`, `6-10`, `11-15`, `>15`), 1st vs 4th blowout spread buckets (`0-20`, `21-40`, `41-60`, `>60`), and 4th-place catch-up General selection choices.

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
- **Deployment Ready:** Externalized configuration via `server_config.json`.

### 5.3 Quick Controls (Keyboard Shortcuts)
- **Shift + Click (Pawn):** Remove pawn from region.
- **Shift + Click (Points/Counters):** Increase value.
- **Ctrl + Click (Points/Counters):** Decrease value.

## 6. Project Status (Current: v1.20.1)
- **Implemented:**
  - Manual & Automated gameplay, Dockerization, multi-phase logic, refined scoring.
  - Auto-advance turn after set placement/kablowanie with Options panel toggle.
  - 2x larger placement points preview popup.
  - Cascading tie-breaker system & Niepochamowany Zwierzęcy Magnetyzm visual effects.
  - Parallel Monte Carlo Simulation Engine with Worker Threads, Socket.io telemetry, and interactive Recharts dashboard.
  - Event Cards Deck & Set Customization Admin Editors.
- **Next Steps:** Continuous AI tuning and community balance analytics.

## 7. Core File Map (AI Navigation)
### 7.1 Backend (Logic, Services & State)
- **Server Entry:** `server/server.js` (Express server, Scalar docs mount, Socket.io)
- **Game Engine:** `server/gameLogic.js` (Phase transitions, move validation, snapshot state)
- **Board/Regions:** `server/boardManager.js` (Map initialization, coordinate logic)
- **Sets/Pawns:** `server/setManager.js` (Pawn generation, Set distribution)
- **Scoring Engine:** `server/scoring/scoring.js`, `shared/scoring/` (Vampire, Werewolf, Ghost, Bardak scoring)
- **Parallel Simulation Engine:**
  - `server/services/simulationJobManager.js` (Worker Thread pool, Socket.io progress broadcasting)
  - `server/services/simulationWorker.js` (Dedicated worker thread simulation runner)
- **Event System:** `server/events/` (`eventEffectManager.js`, `gameEventPhaseManager.js`)
- **API Routes:** `server/routes/` (`games.js`, `sets.js`, `events.js`, `simulation.js`, `config.js`)
- **Persistence:** `server/games/{id}/` (JSON state storage)
- **Master Configs:** `server/configs/` (`game_config.json`, `set_default.json`, `events_default.json`, `events_all.json`)

### 7.2 Frontend (UI, State & Visualization)
- **Root Entry & Context:** `src/main.jsx`, `src/App.jsx`, `src/context/GameContext.jsx`
- **Global State (Socket):** `src/hooks/useGameState.js`
- **Autoplay/Logic Loop:** `src/hooks/useAutoplay.js` (Handles automated game loop, history logging, and `jakub_phase` ticks)
- **Interaction:** `src/hooks/useGameInteraction.js` (Click handlers, drag-and-drop logic)
- **Board Components:** `src/components/Board.jsx`, `src/components/Region.jsx`
- **Board Effects & Overlays:** `src/components/board/` (`JakubOverlay.jsx`, `JakubTracksManager.jsx`, `VisualEffectsManager.jsx`)
- **Admin Tools:**
  - `src/components/AdminSimulate.jsx` (Worker Thread Simulation Dashboard with 13 interactive charts & telemetry)
  - `src/components/AdminEvents.jsx` (Event Cards Deck Manager & Editor)
  - `src/components/AdminSets.jsx` (Custom Sets Editor & Pawn Distribution Tuner)
- **UI Panels:** `src/components/panels/` (PlayersPanel, JakubPanel, HistoryPanel, SetsPanel, EventsPanel, GamePanel, etc.)
- **Styles:** `src/assets/css/` (`base.css`, `game.css`, `modals.css`, `popups.css`, `effects.css`, `events.css`, `admin.css`)
- **Strategy & AI:** `src/strategies/jakubStrategy.js`, `server/services/aiDecisionService.js`

### 7.3 Automation & Deployment (`bash/`)
- **Unified Deploy Script:** `bash/deploy.sh` (Multi-mode: local tag build, `latest`, and `network` deploy to `192.168.111.25`)
- **Remote Host Runner:** `bash/deploy_latest.sh` (Direct host-side image pull and runner on server)


## 8. Development Constraints & Standards
- **Vanilla Only:** No external UI libraries (MUI, Tailwind, etc.). Use `src/assets/css/`.
- **JSON Integrity:** Never modify JSON structures in `server/games/` without ensuring the frontend `useGameState.js` can parse them.
- **Atomic Commits:** Focus on one phase or one component at a time.
- **Docker First:** All backend changes must be verified to run within the Docker container (Alpine-based).

## 9. Documentation System
- **Narrative Context:** Found in `docs/STORY.md`. All UI flavor text and game rules must align with this "Final Raid on Stary Majdan" scenario.
- **API Documentation:** Interactive reference powered by **Scalar** using the OpenAPI 3.0 standard.
  - Spec File: `docs/openapi.json`
  - Endpoint: `/api/docs/api`
  - Static Viewer: `docs/index.html` (Redoc)
- **Game Rules:** Markdown-based rulebook served directly.
  - File: `docs/GAME_RULES.md`
  - Endpoint: `/api/docs/game`
- **UI Integration:** Links available in the application `Footer.jsx`.
- **AI Assistant Context & Rules:** `GEMINI.md`, `GROK.md` (Quick start, architecture navigation, and strict development rules for AI assistants).

