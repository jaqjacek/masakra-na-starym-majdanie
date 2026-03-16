# Set Generation Specification

This document defines the rules and parameters for generating game sets in "Wedrowycz-Gemini".

## 1. Global Pawn Pool (Standard)
| Race | Total Quantity | Power Value |
| :--- | :--- | :--- |
| **Vampire (V)** | 10 | 3 |
| **Werewolf (W)** | 20 | 2 |
| **Ghost (G)** | 30 | 1 |
| **Bardak (B)** | 80 | 1 |

## 2. Per-Set Constraints
- **Max Units:** 5 total pawns per set.
- **Max Power:** Usually 6 (configurable).
- **Vampire Limit:** Max 1 per set.
- **Werewolf Limit:** Max 1 per set.
- **Ghost Limit:** Max 2 per set.
- **Bardak Limit:** No specific limit (used as filler).

## 3. Generation Algorithm (Reverse-Hierarchy)
The algorithm follows a strict probabilistic growth pattern for each set:

1.  **First Pawn Selection:**
    - Every new set starts with exactly one pawn.
    - Each available race (V, W, G, B) has a **25% chance** to be chosen as the starting pawn.
2.  **Iterative Expansion Loop:**
    - The algorithm checks if the current set's power is equal to or exceeds the `maxPower` (default 6), or if the unit limit (5) is reached. If so, the set is complete.
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
1.  **Presence Score (Primary):** Sets are ranked by the combination of races they contain (V=8, W=4, G=2, B=1).
    - Sets with more high-tier races appear first.
    - Example order for Vampire sets: **{V,W,G,B} → {V,W,G} → {V,W,B} → {V,W} → {V,G,B} → {V,G} → {V,B} → {V}**.
2.  **Quantity Tie-break (Secondary):** If two sets contain the exact same races, the one with more units of the highest-tier race (V > W > G > B) comes first.
3.  **Display Order:** Within each set card, pawns MUST be displayed in the order: **V → W → G → B**.
