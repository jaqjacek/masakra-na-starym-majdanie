# Set Generation Specification (aligned with v1.21.0 / `shared/constants.js`)

This document defines the rules and parameters for generating game sets in "MASAKRA na Starym Majdanie".

## 1. Global Pawn Pool (Standard)
| Race | Total Quantity | Power Value |
| :--- | :--- | :--- |
| **Vampire (V)** | 10 | 3 |
| **Werewolf (W)** | 20 | 2 |
| **Ghost (G)** | 30 | 1 |
| **Bardak (B)** | 80 | 1 |

## 2. Per-Set Constraints (`shared/constants.js`)
- **Max Units:** `MAX_UNITS_PER_SET` = **4**.
- **Max Power:** `MAX_POWER` = 6 (configurable).
- **Min Power:** `MIN_SET_POWER` = 3.
- **Max races per set:** `MAX_RACES_PER_SET` = 3.
- **Vampire Limit:** 1 (`PAWN_CONSTRAINTS.vampire`).
- **Werewolf Limit:** 1.
- **Ghost Limit:** 2.
- **Bardak Limit:** 3 (`MAX_BARDAKS_PER_REGULAR_SET`).
- **Generated deck size cap:** `MAX_GENERATED_SETS` = 50.

Hand dealing (not generation): start **5** sets/player; from round 2 **+3** each; pass keeps ≤3. See `AGENTS.md` / `docs/PLAYER_AI.md`.

## 3. Generation Algorithm (Reverse-Hierarchy)
The algorithm follows a strict probabilistic growth pattern for each set:

1.  **First Pawn Selection:**
    - Every new set starts with exactly one pawn.
    - Each available race (V, W, G, B) has a **25% chance** to be chosen as the starting pawn.
2.  **Iterative Expansion Loop:**
    - The algorithm checks if the current set's power is equal to or exceeds the `maxPower` (default 6), or if the unit limit (`MAX_UNITS_PER_SET` = 4) is reached. If so, the set is complete.
    - If there is remaining capacity, the algorithm scans races in **Reverse Hierarchy Order**:
      **Bardak (B) → Ghost (G) → Werewolf (W) → Vampire (V)**
    - For each race in this order:
        - There is a **50% chance** to add a pawn of this race.
        - **If Added:**
            - Verify global pool availability and per-set constraints (e.g., Max 1 Vampire).
            - If valid, add the pawn and **restart the scan** immediately from the bottom (Bardak).
        - **If Not Added:** Move to the next race in the reverse order.
3.  **Finalization:**
    - If a full scan (B to V) completes without any pawn being added, the set is finalized.
    - Power is recalculated based on the final composition.

## 4. Sorting and Re-indexing
After generation or when clicking "Sort Set", all sets are ordered using a hierarchical presence bitmask and then re-indexed (ID 1...N).

### Sorting Logic:
1.  **Complexity First:** Sets are ranked by the combination of races they contain (V=8, W=4, G=2, B=1).
    - Sets with more high-tier races appear first.
    - Order: **{V,W,G,B} → {V,W,G} → {V,W,B} → {V,W} → {V,G,B} → {V,G} → {V,B} → {V}** (and so on for other groups).
2.  **Quantity Tie-break:** If presence scores are identical, sets with more units of the prioritized race (V > W > G > B) come first.
3.  **Display Order:** Within each set card, pawns MUST be displayed in the order: **V → W → G → B**.

## 5. Persistence
Generated sets are stored in the `server/sets/` directory. The configuration used for generation (pawns, power, maxPower) is saved within the JSON file to allow for future cloning or reference.
