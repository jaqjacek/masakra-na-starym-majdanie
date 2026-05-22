# Project Structure: MASAKRA na Starym Majdanie

This file maps the codebase for the **MASAKRA na Starym Majdanie** digital board game simulator. Keep this file updated whenever files are added, removed, or the project structure changes.

## Root Directory
- [Dockerfile](file:///C:/projects/ai/wedrowycz-gemini/Dockerfile) - Multi-stage Alpine Docker build configuration.
- [GEMINI.md](file:///C:/projects/ai/wedrowycz-gemini/GEMINI.md) - Standard instructions and constraints for Gemini sessions.
- [README.md](file:///C:/projects/ai/wedrowycz-gemini/README.md) - General overview and setup guide.
- [cli.js](file:///C:/projects/ai/wedrowycz-gemini/cli.js) - Command-line interface for interaction with the game server.
- [eslint.config.js](file:///C:/projects/ai/wedrowycz-gemini/eslint.config.js) - ESLint rules and syntax checking rules.
- [index.html](file:///C:/projects/ai/wedrowycz-gemini/index.html) - Main entrypoint HTML for Vite dev and production builds.
- [install.cmd](file:///C:/projects/ai/wedrowycz-gemini/install.cmd) - Windows Command Script for installing the Antigravity CLI.
- [package.json](file:///C:/projects/ai/wedrowycz-gemini/package.json) - Application dependencies, scripts, and package information.
- [server_config.json](file:///C:/projects/ai/wedrowycz-gemini/server_config.json) - Local setup server URL configuration.
- [vite.config.js](file:///C:/projects/ai/wedrowycz-gemini/vite.config.js) - Vite compiler and bundling setup.
- [.dockerignore](file:///C:/projects/ai/wedrowycz-gemini/.dockerignore) - Docker build ignore patterns.
- [.geminiignore](file:///C:/projects/ai/wedrowycz-gemini/.geminiignore) - Code search and context gathering filter rules.
- [.gitattributes](file:///C:/projects/ai/wedrowycz-gemini/.gitattributes) - Git attributes specifying line endings (LF).
- [.gitignore](file:///C:/projects/ai/wedrowycz-gemini/.gitignore) - Git ignored directories and files.

## Documentation System (`docs/`)
- [docs/API_DOCS.md](file:///C:/projects/ai/wedrowycz-gemini/docs/API_DOCS.md) - Markdown descriptions of REST endpoints.
- [docs/GAME_RULES.md](file:///C:/projects/ai/wedrowycz-gemini/docs/GAME_RULES.md) - Full Polish rulebook and gameplay rules.
- [docs/GRAPHICS.md](file:///C:/projects/ai/wedrowycz-gemini/docs/GRAPHICS.md) - Specifications for graphics assets and styling design principles.
- [docs/MAINTENANCE_DOCS.md](file:///C:/projects/ai/wedrowycz-gemini/docs/MAINTENANCE_DOCS.md) - Tech details on documentation and automated sync.
- [docs/PROJECT_SPEC.md](file:///C:/projects/ai/wedrowycz-gemini/docs/PROJECT_SPEC.md) - The authoritative Single Source of Truth for architecture and rules.
- [docs/RELEASE.md](file:///C:/projects/ai/wedrowycz-gemini/docs/RELEASE.md) - Checklist and release workflow specifications.
- [docs/SET_GENERATOR.md](file:///C:/projects/ai/wedrowycz-gemini/docs/SET_GENERATOR.md) - Mathematical guidelines for randomized set generations.
- [docs/STORY.md](file:///C:/projects/ai/wedrowycz-gemini/docs/STORY.md) - Flavor text and lore for the board game scenario.
- [docs/index.html](file:///C:/projects/ai/wedrowycz-gemini/docs/index.html) - Redoc viewer for Scalar openapi JSON specification.
- [docs/openapi.json](file:///C:/projects/ai/wedrowycz-gemini/docs/openapi.json) - OpenAPI 3.0 specification file for Scalar API docs.

## Automation & Shell Scripts (`bash/`)
- [bash/deploy.sh](file:///C:/projects/ai/wedrowycz-gemini/bash/deploy.sh) - Production deployment pipeline script to Google Cloud Run.
- [bash/deploy_latest.sh](file:///C:/projects/ai/wedrowycz-gemini/bash/deploy_latest.sh) - Quick Cloud Run update build script.
- [bash/deploy_localy.sh](file:///C:/projects/ai/wedrowycz-gemini/bash/deploy_localy.sh) - Local deployment run and container tester script.
- [bash/deploy_network.sh](file:///C:/projects/ai/wedrowycz-gemini/bash/deploy_network.sh) - Subnetwork binding configuration.

## Backend Server (`server/`)
- [server/server.js](file:///C:/projects/ai/wedrowycz-gemini/server/server.js) - Main Express server and Socket.io engine setup.
- [server/boardManager.js](file:///C:/projects/ai/wedrowycz-gemini/server/boardManager.js) - Board setup, regions, and neighbor mapping logic.
- [server/gameLogic.js](file:///C:/projects/ai/wedrowycz-gemini/server/gameLogic.js) - Turn phase transitions, state validation, and client action engines.
- [server/setManager.js](file:///C:/projects/ai/wedrowycz-gemini/server/setManager.js) - Random set generation, pawn draw piles, and player hands logic.
- [server/scoring.js](file:///C:/projects/ai/wedrowycz-gemini/server/scoring.js) - Multi-phase calculation of player victory scores.
- [server/socketHandler.js](file:///C:/projects/ai/wedrowycz-gemini/server/socketHandler.js) - Event communication between clients and backend sockets.
- [server/constants.js](file:///C:/projects/ai/wedrowycz-gemini/server/constants.js) - Global constant configurations.
- [server/gameEventPhaseManager.js](file:///C:/projects/ai/wedrowycz-gemini/server/gameEventPhaseManager.js) - Game event phase sequencing and selection logic.
- [server/eventEffectManager.js](file:///C:/projects/ai/wedrowycz-gemini/server/eventEffectManager.js) - Action execution logic for specific in-game events.

### Subdirectories under `server/`
- **server/configs/** - Externalized JSON rules and defaults.
  - [server/configs/game_config.json](file:///C:/projects/ai/wedrowycz-gemini/server/configs/game_config.json) - Global board game limits and parameters.
  - [server/configs/server_config.json](file:///C:/projects/ai/wedrowycz-gemini/server/configs/server_config.json) - Local server endpoints and defaults.
  - [server/configs/set_default.json](file:///C:/projects/ai/wedrowycz-gemini/server/configs/set_default.json) - Pre-configured starting card collections.
  - [server/configs/events_default.json](file:///C:/projects/ai/wedrowycz-gemini/server/configs/events_default.json) - Dynamic in-game events definition schema.
- **server/routes/** - REST controllers mapping:
  - `config.js`, `games.js`, `sets.js`, `simulation.js`.
- **server/services/** - Helper services such as game state simulation.
- **server/sets/** - Saved pawn collections generated through simulation/admin tools.
- **server/games/** - Unique persistent game directories containing `state.json`, `map.json`, `sets.json`, `players.json`.

## Frontend Web Application (`src/`)
- [src/App.jsx](file:///C:/projects/ai/wedrowycz-gemini/src/App.jsx) - Main layout structure, routers, and theme controls.
- [src/main.jsx](file:///C:/projects/ai/wedrowycz-gemini/src/main.jsx) - DOM mounting scripts for React.

### Subdirectories under `src/`
- **src/assets/** - CSS styles and dynamic game image assets.
  - [src/assets/css/base.css](file:///C:/projects/ai/wedrowycz-gemini/src/assets/css/base.css) - General reset and layout design variables.
  - [src/assets/css/game.css](file:///C:/projects/ai/wedrowycz-gemini/src/assets/css/game.css) - Board visual style and animations.
  - [src/assets/css/admin.css](file:///C:/projects/ai/wedrowycz-gemini/src/assets/css/admin.css) - Analytics charts and simulation dashboards theme.
- **src/components/** - Modals, custom components, headers, footers, page layouts.
  - [src/components/Board.jsx](file:///C:/projects/ai/wedrowycz-gemini/src/components/Board.jsx) - Rendering grid, coordinates, and region maps.
  - [src/components/Region.jsx](file:///C:/projects/ai/wedrowycz-gemini/src/components/Region.jsx) - Region content, pawns lists, overlays.
  - [src/components/Bag.jsx](file:///C:/projects/ai/wedrowycz-gemini/src/components/Bag.jsx) - Interactive pawn bags and counters.
  - **src/components/panels/** - Dashboards:
    - `JakubPanel.jsx`, `PlayerPanel.jsx`, `SetsPanel.jsx`, `HistoryPanel.jsx`, `GameEventPanel.jsx`.
  - **src/components/docs/** - Custom rendered styled documentation components:
    - `GameRulesPage.jsx`, `ApiDocsPage.jsx`.
- **src/hooks/** - React custom hooks handling:
  - `useGameState.js` (WebSockets and optimistic updates)
  - `useGameInteraction.js` (Click events, drag-and-drop support, shortcuts)
- **src/logic/** - UI local helpers for scoring and graphics filters.
- **src/strategies/** - AI movement policies (`jakubStrategy.js`).
- **src/services/** - Sockets and fetch wrappers for API.

## Testing Suite (`tests/`)
- [tests/test_full_simulation.sh](file:///C:/projects/ai/wedrowycz-gemini/tests/test_full_simulation.sh) - Bash multi-file simulation integrity validation.
- [tests/sets.json](file:///C:/projects/ai/wedrowycz-gemini/tests/sets.json) - Simulated set generation data.
- [tests/game.json](file:///C:/projects/ai/wedrowycz-gemini/tests/game.json) - Simulated game session parameters.
