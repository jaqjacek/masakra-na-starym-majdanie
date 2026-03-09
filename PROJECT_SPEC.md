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
- **AI Integration:** Google Gemini API (Future scope)

## 3. Features (Version 1)
- **5x5 Grid Board:** A board composed of 25 square regions.
- **Regions:** Each region acts as a container for pawns and displays counters for each pawn type present.
- **Pawn Types:** 4 distinct types of pawns, represented as colored squares:
  - Type A: Color 1
  - Type B: Color 2
  - Type C: Color 3
  - Type D: Color 4
- **Infinite Bags:** UI elements outside the board representing infinite sources of each pawn type.
- **Drag-and-Drop Mechanism:**
  - `mouse-down` on a bag: A pawn "attaches" to the cursor.
  - `mouse-up` on a region: The pawn is added to that region.
  - `mouse-up` elsewhere: The pawn is discarded.
- **Pawn Counting:** If a pawn type is added to a region, its icon appears with a counter (starting at 1). Subsequent pawns of the same type increment the counter. Removing a pawn decrements it.
- **Global Pawn Counter:** A total count of all pawns across all regions, displayed prominently above the board.

## 4. Architecture & File Structure
- `src/main.jsx`: Entry point.
- `src/App.jsx`: Main application state (managing the board and active drag).
- `src/components/Board.jsx`: Renders the 5x5 grid.
- `src/components/Region.jsx`: Renders an individual square and its pawn counts.
- `src/components/Bag.jsx`: Renders the infinite source for pawns.
- `src/components/PawnGhost.jsx`: The visual element that follows the cursor during drag.

## 5. Coding Standards
- Use functional components and Hooks (`useState`, `useEffect`, `useMemo`).
- All code, comments, and documentation must be in English.
- Use Vanilla CSS for styling (as per primary instructions).
- Ensure the drag-and-drop feels smooth and responsive.

## 6. AI Context
This file is the primary source of truth for the project's logic and structure.

## 7. Developer & AI Collaboration
- **Instruction Language:** Polish/English.
- **Generation Language:** English.
