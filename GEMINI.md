# GEMINI Instructions

Current release: **v1.21.0**. Next work: **refine player AI**. Handoff: `COPILOT.md`, `docs/PLAYER_AI.md`.

## 1. Single Source of Truth
The file `docs/PROJECT_SPEC.md` is the authoritative source for architecture, file mapping, and standards. **Always read it first.** For player/Herszt AI, read `docs/PLAYER_AI.md` before editing.

## 2. Context Efficiency
- **Skip Research:** For standard UI/Logic updates, refer to the 'Core File Map' in `docs/PROJECT_SPEC.md` instead of full-project `grep`.
- **No Structure File:** Do not look for `project_structure.md`. Use the tree provided in the session context.

## 3. General Mandates
- Ensure all code changes align with the tech stack defined in `docs/PROJECT_SPEC.md`.
- Update `docs/PROJECT_SPEC.md` immediately if architectural paths or core JSON schemas change.
- **API Documentation:** Always update `docs/openapi.json` whenever modifying or adding REST API endpoints to ensure the documentation remains synchronized with the implementation.
- **Shell & Scripting:** Always use **Bash** for scripts, automation, and testing. Avoid PowerShell scripts (`.ps1`).
- **Player AI:** `server/services/playerAiService.js`. Placement: `shared/sharedPlacementManager.js`. Jakub: `src/strategies/jakubStrategy.js`. There is no `aiDecisionService.js`.
- **i18n:** Five locales only (`pl`, `en`, `cs`, `uk`, `tlh`). Do not restore 110 generated languages.
- **Hand/pass (v1.21.0):** 5 starting sets; round 1 DRAW SETS adds no player sets; from round 2 each player gets +3; pass keeps ≤3 with 0 points.
