# Agent instructions — MASAKRA na Starym Majdanie

You are working on a React 19 + Express 5 board-game simulator. **Current release: v1.20.2. Next work: player AI.**

1. Read [`COPILOT.md`](COPILOT.md) first (handoff + uncommitted WIP).
2. Read [`docs/PLAYER_AI.md`](docs/PLAYER_AI.md) before changing AI, placement, pass, or simulation player turns.
3. Architecture SSOT: [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md). Rules: [`docs/GAME_RULES.md`](docs/GAME_RULES.md).
4. Fast file map: [`GROK.md`](GROK.md).

Player AI lives in `server/services/playerAiService.js`. Placement scoring lives in `shared/sharedPlacementManager.js`. Jakub AI lives in `src/strategies/jakubStrategy.js`. There is no `aiDecisionService.js`.

Keep the uncommitted hand/pass changes (5 starting sets, +3 from round 2, pass keep-3 with 0 points). Do not restore 110 locales. Vanilla CSS only.
