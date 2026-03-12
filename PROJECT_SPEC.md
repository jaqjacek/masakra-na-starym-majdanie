# Project Specification: Wedrowycz-Gemini

## 1. Project Overview
**Name:** Wedrowycz-Gemini
**Description:** A digital board game simulator where players manage pieces (pawns) and special game objects across a 5x5 grid.
**Goal:** A multi-client, real-time synchronized game engine with complex movement rules, resource distribution (Sets), and phase-based gameplay.

## 2. Tech Stack
- **Frontend Framework:** React 19 (Hooks, Portals)
- **Backend:** Node.js with Express
- **Real-time Sync:** Socket.io
- **Build Tool:** Vite
- **Styling:** Vanilla CSS
- **Data Persistence:** Multi-file JSON storage per game session.

## 3. Core Architecture
### 3.1 Multi-Game System
- **Game Isolation:** Each game session is identified by a unique ID in the URL (`/game/{id}`).
- **Data Storage:** Each game has its own directory in `games/{id}/` containing:
  - `map.json`: Region coordinates, neighbors, and pawn instances.
  - `players.json`: Player names, points, and assigned General race.
  - `sets.json`: Randomized pawn sets and their power configurations.
  - `state.json`: Current game phase and metadata.

### 3.2 Real-time Synchronization
- **WebSocket Integration:** Any change made by one client (placing pawns, moving Jakub, changing points) is instantly broadcast to all other clients in the same game room.
- **Optimistic Updates:** Frontend updates state immediately for responsiveness, then synchronizes with the server.

## 4. Game Mechanics
### 4.1 Pawn Movement & Range
- **Speed Variable:** Each pawn type has a `speed` parameter (V: 999, W: 2, G: 1, B: 1).
- **Movement Validation:** Orthogonal BFS algorithm calculates reachable regions based on speed. Valid targets are highlighted with green borders.
- **States:** Pawns placed on the board are `ENABLED` by default. `DISABLED` pawns cannot be moved.

### 4.2 Game Objects (Special Pieces)
- **Jakub (Unique):** 
  - Only one instance can exist on the map.
  - **Dynamic Parameters:** Managed via a right-side dashboard (Speed, Depleting Range, Anger per race).
  - **Movement Locking:** Jakub's range decreases per move; he stops when range reaches 0.
  - **Random Initialization:** Starts in a random interior (non-border) region.

### 4.3 Sets System
- **Bulk Placement:** Pawn collections (Sets) can be dragged from a sidebar to board regions.
- **Constraints:** Max 5 pawns per set, max 3 races, and max 6 "Power" (V:3, W:2, G:1, B:1).
- **Ownership:** Sets can be "Global" or distributed to specific players.

### 4.4 Phase-Based Gameplay
- **Setup Phase:** Board initialization, manual/automatic General assignment, and set distribution.
- **Player Phase:** Active pawn placement and movement.
- **Jakub Phase:** Special management of the Jakub object.

## 5. UI & Interaction
### 5.1 Player-Specific Clients
- **Join as Player:** URL parameter `?player={id}` identifies the user.
- **Visual Context:** Current player's name is highlighted in green. If no player is selected, interactive dots allow joining as any player.
- **Private View:** Players see only their own assigned Sets; spectators see global sets.

### 5.2 Responsive Header & Menu
- **Dropdown Menu:** Tucked under a hamburger icon on the left of the fixed header.
- **Phase Controls:** Buttons like "Start Round" or "Finish Setup" appear dynamically based on the game phase.
- **Sets Toggle:** Quick toggle to show/hide the Sets sidebar.

### 5.3 Quick Controls (Keyboard Shortcuts)
- **Shift + Click (Pawn):** Remove pawn from region.
- **Shift + Click (Summary Icon):** Add pawn to region.
- **Shift + Click (Points/Counters):** Increase value.
- **Ctrl + Click (Points/Counters):** Decrease value.

## 6. Project Status (Current: v1.1.5)
- **Implemented:** Multi-game support, WebSockets, complex movement logic, unique game objects, player points, automated set generation, and phase transitions.
- **Next Steps:** Expansion of Player Phase rules and automated Jakub Phase logic.
