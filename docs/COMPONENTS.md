# React Component Architecture

Frontend of *MASAKRA na Starym Majdanie* (v1.23.0). Player AI is **server-side** (`docs/PLAYER_AI.md`); these components only claim seats and render state.

## Component Tree

```text
App.jsx (routes)
 ├── LandingPage                  /
 ├── GameRulesPage                /docs/game
 ├── AdminSets / AdminEvents / AdminSimulate
 └── Game shell                   /game/{id}
      ├── GameHeader
      ├── Board
      │    ├── VisualEffectsManager
      │    ├── JakubTracksManager
      │    ├── Region
      │    └── JakubOverlay
      ├── panels/* (+ MobileTabBar)
      ├── Bag, MouseElement
      ├── PawnStatusPopup
      └── EndGamePopup
 Footer (out of game: landing, rules, admin)
```

## Core Components

### `App.jsx`
- The root orchestration component.
- **Responsibilities:** Passes state down, coordinates panels, observes changes to spawn visual effects (explosions, points), manages the `isEndGamePopupOpen` state.

### `Board.jsx` (`BoardComponent`)
- **Responsibilities:** Renders the 6x6 grid. Acts as a container for all map-based rendering.
- Maps over `gameState.regions` to render individual `<Region>` components.
- Manages the absolute positioned overlays (`VisualEffectsManager`, `JakubTracksManager`, `JakubOverlay`).

### `Region.jsx`
- **Responsibilities:** Represents a single cell on the 6x6 grid.
- Renders background based on `region.type` (e.g. `base_vampire`, `mountain`).
- Renders `pawn-indicator` elements for the units currently inside the region.
- Applies visual cues like `.witness-glow` and `border` colors for valid targets.
- Handles mouse events (click, shift+click, drag-over) and propagates them up.

## Board Overlays (`src/components/board/`)

Instead of burying complex visual rendering inside the grid layout, these are decoupled:

### `JakubOverlay.jsx`
- **Responsibilities:** Renders the Jakub icon (`JAKUB_ICON`) on the board.
- Uses absolute positioning mapped from the current cell's grid coordinates to allow for smooth CSS transitions (`transform: translate`) when Jakub moves.

### `JakubTracksManager.jsx`
- **Responsibilities:** Draws the SVG dotted lines and footprint icons tracing Jakub's path.
- Consumes `gameState.jakubPath`.

### `VisualEffectsManager.jsx`
- **Responsibilities:** Renders temporary effects like particle explosions and floating text (+1 Pkt, Magnetism).
- Consumes the `visualEffects` state from `App.jsx`. Auto-cleans up CSS animations.

## UI Panels (`src/components/panels/`)

The right-side dashboard is modularized into collapsible panels.

- **`PlayersPanel`**: Scores, pass status, **manual vs AI seat toggle** (`manualPlayers`).
- **`JakubPanel`**: Speed, range, anger gauges.
- **`SetsPanel`**: Draw pile + claimed player's hand. Drag-and-drop onto the board.
- **`HistoryPanel`**: `gameState.history` (localized via `logTranslator.js`).
- **`EventsPanel`**: Drawn events.
- **`GamePanel`**: Draw Sets, Next, JAKUB AUTO / FULL AUTO, `autoClickNext`. Admin tools are separate routes.
- **`MobileTabBar`**: Players / Jakub / Game / History when `html.mobile-ui`.
- **`LoadSavesPanel`**: Snapshot restore.

Admin (not in the game shell): `AdminSets` `/admin/sets`, `AdminEvents` `/admin/events`, `AdminSimulate` `/admin/simulate`.

Unclaimed players are moved by the server; the UI must not locally simulate their turns.
