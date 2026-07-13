# State Management & Data Flow

This document outlines how game state is synchronized, managed, and consumed in the frontend application of *MASAKRA na Starym Majdanie*.

## 1. Global State Synchronization

The game state is stored centrally on the Node.js server. The frontend hooks into this state via WebSockets.

### `useGameState`
- **Location:** `src/hooks/useGameState.js`
- **Purpose:** Acts as the primary bridge between the React frontend and the backend via Socket.io.
- **Mechanism:**
  - On mount, it joins a socket room specific to the `gameId`.
  - It listens for `gameState` and `gameHistory` events from the server and updates local React state (`gameState`, `gameHistory`).
  - It exposes a method `updateGameWithSync(newState)` which optimistically updates the local UI and emits a `updateState` event to the server.

## 2. Main Application Orchestration (`App.jsx`)

`App.jsx` is the root container for the game board and panels. It consumes `gameState` and orchestrates various local states and sub-hooks.

### Local State in `App.jsx`
- **`hoveredPawn` / `hoveredSet` / `hoveredJakubIcon`:** Transient UI states for highlighting regions and ranges.
- **`visualEffects`:** An array of active visual effects (explosions, floating texts) rendered by `VisualEffectsManager`.
- **`isEndGamePopupOpen`:** Controls the visibility of the End Game modal.

### Interaction Hooks
- **`useGameInteraction`:** Extracts all the complex drag-and-drop, pawn clicking, and map interaction logic away from `App.jsx`. It consumes the `updateGameWithSync` function to mutate state based on user actions.

## 3. The Autoplay Loop & History

When the game enters the `jakub_phase`, or when automated modes are toggled (`jakub_autoplay` / `full_autoplay`), the game is driven by `useAutoplay.js`.

### `useAutoplay`
- **Location:** `src/hooks/useAutoplay.js`
- **Mechanism:** Uses a `setInterval` loop (or `setTimeout`-like behavior) to continuously tick the game forward based on the current phase.
- **Logging Engine:**
  - `addLog(state, text, metadata)` pushes a new event into `state.history`.
  - The `history` array serves as an event bus for the visual effects system.

### Visual Effects System (Event Observers)
Instead of hardcoding visual animations into the game logic, `App.jsx` observes state changes to spawn visual effects.

1. **Pawn Death Observer (`prevRegionsRef`):**
   - `App.jsx` compares the current `gameState.regions` pawn counts against the previous render (`prevRegionsRef`).
   - If a pawn count decreases, it spawns an `explosion` and negative floating `text` (e.g., "V -1 Pkt").
   - *Exception:* If `gameState.magnetismPullRegions` contains the region ID, the explosion is suppressed (because pawns were moved by Animal Magnetism, not killed).

2. **History Log Observer (`prevHistoryLengthRef`):**
   - `App.jsx` watches for new entries in `gameState.history`.
   - If a log contains `type === 'witness_points'`, it spawns positive floating text ("+1 Pkt").
   - If a log contains `magnetismStart: true`, it spawns the "Niepochamowany zwierzęcy Magnetyzm" text.

## 4. Jakub Phase & Turn Logic

The logic for Jakub's automated turn resides in `src/strategies/jakubStrategy.js`.

### `executeJakubStep(gameState)`
- Takes the current state and returns a `{ newState, actionTaken, log, metadata }` object.
- **Tick 1:** Kills exactly 1 pawn in his current region (if anger > 0).
- **Tick 2:** Moves to a new region based on range, anger tiers, and the cascading tie-breaker algorithm.
- **Magnetism Logic:**
  - If a tie is absolute, it sets `workState.jakubMagnetismPending = tiedRegions` and returns `magnetismStart: true` metadata.
  - On the next tick, it sees `jakubMagnetismPending`, pulls pawns to Jakub's region, sets `workState.magnetismPullRegions`, and returns.

## 5. Summary Flow of an Automated Action

1. `useAutoplay` calls `executeJakubStep`.
2. `executeJakubStep` modifies the cloned state and returns the result.
3. `useAutoplay` appends the `log` to `history` via `addLog(..., metadata)`.
4. `useAutoplay` calls `updateGameWithSync(newState)`.
5. Local state updates immediately, and the update is sent to the server.
6. `App.jsx` re-renders.
7. `App.jsx` observers (`prevRegionsRef` and `prevHistoryLengthRef`) notice changes and update `visualEffects` local state.
8. `VisualEffectsManager` renders the animations over the board.
