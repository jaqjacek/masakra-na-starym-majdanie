# Copilot instructions — MASAKRA na Starym Majdanie

Read `COPILOT.md` and `docs/PLAYER_AI.md` before editing game logic. Architecture: `docs/PROJECT_SPEC.md`. Rules: `docs/GAME_RULES.md`. File map: `GROK.md`.

**Status:** v1.23.0 on `develop`. Player AI + spectator replay shipped; refine heuristics next.

## Stack

React 19 + Vite, Express 5, Socket.io, worker_threads simulations, vanilla CSS, JSON sessions in `server/games/{id}/`.

## Player AI (do not invent new entry points)

- Server loop: `server/services/playerAiService.js` (`revealAfterChange` / `afterGameChange`). Hooked from `server/socketHandler.js` after every action. Human viewers get one `spectatorAction` beat per AI move, held for 5× the current autoplay tick.
- Unclaimed seats act automatically. Claimed IDs: `state.manualPlayers`.
- Placement / pass scoring: `shared/sharedPlacementManager.js` (`findBestPlacement`, `selectExcessSetsOnPass`).
- General pick: `shared/generalSelectionManager.js`.
- Jakub rampage: `src/strategies/jakubStrategy.js` (separate from player AI).
- There is **no** `server/services/aiDecisionService.js`.

Current player AI is one-ply greedy (net points − Jakub threat + endgame bonus weighted by `currentRound / 12`). It compares place, kablowanie (+1 minus fury cost), and pass. Pass discard is **random keep-3**. Do not rewrite Jakub AI unless asked.

## Live dealing / pass rules (v1.21.0)

- Start of game: 5 sets per player (`INITIAL_SETS_PER_PLAYER`).
- Round 1 DRAW SETS: no extra player sets; Jakub draws 2.
- Round 2+: each player is dealt **+3** sets (append, not top-up).
- Pass: randomly keep ≤3; excess to Jakub, **0 points**, fury still updates.
- Voluntary kablowanie: still +1 point.

Constants: `shared/constants.js`. Runtime override: `server/configs/game_config.json`.

## Constraints

- Vanilla CSS in `src/assets/css/` only. No Tailwind/MUI/Bootstrap.
- Locales: exactly `pl`, `en`, `cs`, `uk`, `tlh`. Five footer flags. Do not restore 110 languages or run `scripts/` locale generators.
- `SERVER_URL` is `''`. Vite proxy host is `127.0.0.1`.
- Dockerfile must `COPY src/ ./src/` (backend imports `src/strategies/jakubStrategy.js`).
- `server.listen(PORT)` with no `'0.0.0.0'`.
- Update `docs/openapi.json` when REST routes change.
- Talk to the user in Polish; code, commits, and identifiers in English.

## Commands

`npm run server` (3001), `npm run dev` (5173), `npm test`. Deploy via `.grok/skills/deploy/SKILL.md`.
