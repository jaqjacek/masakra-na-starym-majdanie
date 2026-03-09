# Project Specification: Wedrowycz-Gemini

## 1. Project Overview
**Name:** Wedrowycz-Gemini
**Description:** A digital board game simulator where players can manage pieces (pawns) on a segmented board.
**Goal:** Create a functional React-based board game to simulate gameplay, focusing on piece placement, movement, and region-based management.

## 2. Tech Stack
- **Frontend Framework:** React
- **Build Tool:** Vite
- **Language:** JavaScript (ES6+)
- **Styling:** CSS (Vanilla)
- **Icons:** SVG (Custom generated)
- **API Integration:** REST (Fetch API)

## 3. Features (Version 1 - Completed)
- **5x5 Grid Board:** A board composed of 25 square regions.
- **Regions:** Each region acts as a container for pawns and displays icons with counters for each pawn type present.
- **Pawn Types (Races):**
  - **Vampire (V):** White 'V' on dark red background.
  - **Werewolf (W):** Black 'W' on light brown background.
  - **Ghost (G):** Black 'G' on light blue/white background.
  - **Bardak (B):** Black 'B' on dark gray background.
- **Infinite Bags:** UI elements outside the board representing infinite sources for each pawn type, labeled with full race names.
- **Drag-and-Drop Mechanism:**
  - `mouse-down` on a bag: A pawn "attaches" to the cursor.
  - `mouse-up` on a region: The pawn is added to that region.
  - `mouse-up` elsewhere: The pawn is discarded.
- **Pawn Counting:**
  - **Local Counters:** If a pawn type is added to a region, its icon appears with a count.
  - **Global Counter:** A total sum of all pawns on the board.
  - **Breakdown Counter:** Detailed total count for each specific race displayed above the board.
- **Removal Mechanism:** Clicking on a pawn icon within a region removes one pawn of that type from the region.

## 4. Features (Version 1.1 - In Progress)
- **REST API Integration:**
  - **GET /map:** Fetch the current state of the map (pawn positions).
  - **POST /map:** Upload the current state of the map to the server.
- **State Persistence:** Ability to load and save game state via the API.

## 5. Architecture & File Structure
- `src/main.jsx`: Entry point.
- `src/App.jsx`: Main application state, game logic, and global counter management.
- `src/App.css`: All application and component styles.
- `src/assets/icons/`: Directory containing SVG icon files for each race.
- `src/components/Board.jsx`: Grid rendering component.
- `src/components/Region.jsx`: Logic for individual board squares and pawn management.
- `src/components/Bag.jsx`: Infinite pawn source component with labels.
- `src/components/PawnGhost.jsx`: Visual follower for the drag-and-drop action.
- `src/services/api.js`: (New) Service for handling API requests.

## 6. Coding Standards
- Functional components and Hooks (`useState`, `useMemo`, `useCallback`, `useEffect`).
- All code, comments, and documentation in English.
- Vanilla CSS for all styling.
- Responsive drag-and-drop using global mouse event listeners.

## 7. AI Context
This file is the primary source of truth for the project's logic and structure.

## 8. Developer & AI Collaboration
- **Instruction Language:** The developer will provide instructions in Polish or English (often mixed).
- **Output Language:** All code, comments, documentation, and Markdown files must be written in English.
