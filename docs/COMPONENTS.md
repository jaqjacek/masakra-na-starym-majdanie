# React Component Architecture

This document describes the hierarchical structure and responsibilities of the React components in the frontend of *MASAKRA na Starym Majdanie*.

## Component Tree

```text
App (src/App.jsx)
 ├── GameHeader (src/components/GameHeader.jsx)
 ├── BoardComponent (src/components/Board.jsx)
 │    ├── VisualEffectsManager (src/components/board/VisualEffectsManager.jsx)
 │    ├── JakubTracksManager (src/components/board/JakubTracksManager.jsx)
 │    ├── Region (src/components/Region.jsx)
 │    └── JakubOverlay (src/components/board/JakubOverlay.jsx)
 ├── Panels (src/components/panels/*)
 │    ├── PlayersPanel
 │    ├── JakubPanel
 │    ├── SetsPanel
 │    ├── HistoryPanel
 │    ├── EventsPanel
 │    ├── LoadSavesPanel
 │    └── GamePanel
 ├── PawnStatusPopup (src/components/PawnStatusPopup.jsx)
 └── EndGamePopup (Modal within App)
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

- **`PlayersPanel`**: Lists players, scores, pass status.
- **`JakubPanel`**: Displays Jakub's stats (Speed, Range, Anger gauges).
- **`SetsPanel`**: Displays the Set marketplace (Draw Pile) and the player's Hand. Handles drag-and-drop of sets onto the board.
- **`HistoryPanel`**: Renders the `gameState.history` log array.
- **`EventsPanel`**: Shows recent game events and auto-play logs.
- **`GamePanel`**: Contains standard game controls (Draw Sets, Next Round, Autoplay toggles). Admin tools live on `/admin/sets`, `/admin/events`, `/admin/simulate`.
