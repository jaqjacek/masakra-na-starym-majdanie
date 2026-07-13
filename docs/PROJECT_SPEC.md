
# Project Specification: MASAKRA na Starym Majdanie

## 1. Project Overview
**Name:** MASAKRA na Starym Majdanie
**Description:** A digital board game simulator where players manage pieces (pawns) and special game objects across a 6x6 grid.
**Goal:** A multi-client, real-time synchronized game engine with complex movement rules, resource distribution (Sets), and phase-based gameplay.

## 2. Tech Stack
- **Frontend Framework:** React 19 (Hooks, Portals)
- **Backend:** Node.js with Express 5
- **Real-time Sync:** Socket.io
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

### 3.2 Real-time Synchronization
- **Dynamic Rebranding:** The game title is fully dynamic and managed in `server/configs/game_config.json`.
- **WebSocket Integration:** Any change made by one client (placing pawns, moving Jakub, changing points, triggering events) is instantly broadcast to all other clients in the same game room.
- **Optimistic Updates:** Frontend updates state immediately for responsiveness, then synchronizes with the server.

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
  - **Niepochamowany Zwierzęcy Magnetyzm:** When absolute tie persists after all bands checked, all pawns from tied regions are pulled to Jakub's region.

### 4.3 Sets System
- **Bulk Placement:** Pawn collections (Sets) can be dragged from a sidebar to board regions.
- **Rules:** 
  - Max 5 pawns per set, max 3 bands, and max 6 "Power" (V:3, W:2, G:1, B:1).
  - Can only be placed in empty regions and if pawn pool allows.
  - Can be given to Jakub for 1 point, increasing his anger/range automatically.
- **Ownership:** Sets can be in the "Draw Pile", "Discarded", or held by a specific Player/Jakub.

### 4.4 Phase-Based Gameplay
- **Setup Phase:** Board initialization and set distribution (Manual "DRAW SETS" button).
- **General Phase:** Dedicated phase for players to choose their General/Band.
- **Player Phase:** Active pawn placement (from hand) and movement. Includes "PASS" mechanism.
- **Jakub Phase:** Automated sequences where Jakub strengthens and attacks.
- **Final Scoring:** Automatic calculation of end-game bonuses (End Game phase).

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

## 6. Project Status (Current: v1.8.0)
- **Implemented:** Manual & Automated gameplay, Dockerization, Deployment scripts, multi-phase logic, refined scoring, UI polishing, cascading tie-breaker system, and Niepochamowany Zwierzęcy Magnetyzm mechanic.
- **Next Steps:** Enhancing simulation accuracy and AI strategies.

## 7. Core File Map (AI Navigation)
### 7.1 Backend (Logic & State)
- **Game Engine:** `server/gameLogic.js` (Phase transitions, move validation)
- **Board/Regions:** `server/boardManager.js` (Map initialization, coordinate logic)
- **Sets/Pawns:** `server/setManager.js` (Pawn generation, Set distribution)
- **Scoring:** `server/scoring/scoring.js` (Final point calculation)
- **Persistence:** `server/games/{id}/` (JSON state storage)
- **Config:** `server/configs/game_config.json`, `server/configs/set_default.json`

### 7.2 Frontend (UI & Interaction)
- **Main App & State Orchestration:** `src/App.jsx`
- **Global State (Socket):** `src/hooks/useGameState.js`
- **Autoplay/Logic Loop:** `src/hooks/useAutoplay.js` (Handles automated game loop, history logging, and `jakub_phase` ticks)
- **Interaction:** `src/hooks/useGameInteraction.js` (Click handlers, drag-and-drop logic)
- **Board Components:** `src/components/Board.jsx`, `src/components/Region.jsx`
- **Board Effects & Overlays:** `src/components/board/` (`JakubOverlay.jsx`, `JakubTracksManager.jsx`, `VisualEffectsManager.jsx`)
- **UI Panels:** `src/components/panels/` (PlayersPanel, JakubPanel, HistoryPanel, SetsPanel, EventsPanel, GamePanel, etc.)
- **Styles:** `src/assets/css/` (`base.css`, `game.css`, `modals.css`, `popups.css`, `effects.css`, `events.css`, `admin.css`)
- **Strategy:** `src/strategies/jakubStrategy.js` (Contains Jakub's target selection, cascading tie-breaker, and Magnetism mechanics)

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
