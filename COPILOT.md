# Copilot handoff — MASAKRA na Starym Majdanie

**Read this first.** Then [`docs/PLAYER_AI.md`](docs/PLAYER_AI.md) and [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md). Game rules: [`docs/GAME_RULES.md`](docs/GAME_RULES.md).

| | |
| :--- | :--- |
| **Version** | **v1.21.0** (`package.json`, `src/constants/version.js`) |
| **Branch** | `develop` |
| **Next work** | Refine player AI (strategic keep-3, look-ahead, sim parity, tests) |
| **Working tree** | Clean after v1.21.0 release commit (do not push if origin is down) |

Talk to the user in Polish. Commits, tags, identifiers, and new docs stay in English unless they asked for Polish copy.

---

## What this repo is

Digital 4-player tactical board game on a 6×6 grid (Jakub Wędrowycz universe). React 19 + Vite frontend, Express 5 + Socket.io backend, JSON session files, worker-thread Monte Carlo sims.

Players are **Hersztowie**. Unclaimed seats are **server-side AI**. Jakub’s rampage is a separate AI in `src/strategies/jakubStrategy.js`.

---

## Shipped in v1.21.0 (do not revert)

**Hand dealing**

- Game start: each player gets **5** sets (`initialSetsPerPlayer` / `INITIAL_SETS_PER_PLAYER`).
- Round 1 **DRAW SETS** does **not** add player sets (Jakub still draws 2).
- From round 2: each player is dealt **+3** sets (append, **not** topped up to 3). A player who kept 3 can start the round with 6.

**Pass / kablowanie**

- On pass, randomly keep at most **3** (`MAX_SETS_KEPT_ON_PASS`).
- Excess sets go to Jakub as **donos** (fury/range update, **0 points**).
- Voluntary mid-turn **kablowanie** still awards **+1** point (`KABLOWANIE_POINTS`).
- Live AI compares place / kablowanie / pass; pass discard is still random keep-3.

**Other**

- Spectator all-AI record/replay (`spectatorReplayService`, `useSpectatorPlayback`).
- App.jsx split under 1000 LOC; board visual effects hook; stats category `rambo` → `placement`.
- Locale `rules_flow_*` strings may still lag rules text — fix when next touching i18n.

---

## Player AI — current architecture

Canonical server loop: **`server/services/playerAiService.js`**.

After every socket action, `server/socketHandler.js` calls `persistThenAi` → `enqueueGame` → `revealAfterChange` (max 200 steps). Unclaimed players act immediately. Claimed IDs live in `state.manualPlayers`. If a human is watching, each AI place, pass, and kablowanie is emitted separately and held for 5× the current autoplay tick. All-AI games are not slowed.

Three paces, none of them may block the queue: simulation has no UI wait; a claimed human gets the 5× reveal; an admin watching AI-only is paced only on the client. `POST /event-phase` runs once per round (queued, no rewind). Client Jakub kill steps wait 2× the autoplay tick, capped at 1s. Other floats still use 1.5s.

**Spectator replay** (separate from the live reveal): `POST /api/map/:gameId/spectator/start` records a full all-AI game from a fresh setup into `server/games/{id}/replay.json`, then the client plays the frames back at 2× tick (max 1s). The button is only at setup/round 1 and again at End Game. Recording does not sleep. A saved replay is read-only: socket mutations are rejected. Playback ignores socket echoes.

| Decision | Implementation | Quality |
| :--- | :--- | :--- |
| General pick | `shared/generalSelectionManager.js` `chooseGeneral` | Weighted hand + anger + board presence. No look-ahead. |
| Place vs pass | `SharedPlacementManager.findBestPlacement` then `aiPlaceOrPass` | One-ply greedy. Place if `utilityPlace >= 0`, else pass. |
| Where / which set | Same scorer: `netScore - threatPenalty + endGameValue * (currentRound / 12)` | Place if best score ≥ 0. Endgame matches final scoring. |
| Pass excess | `selectExcessSetsOnPass` | Random keep-3. No strategic discard. |
| Kablowanie | `choosePlayerAction` vs place and pass | +1 minus own-race and range cost. Does not pass the seat. |
| Jakub phase | `src/strategies/jakubStrategy.js` | Separate, mature. |

**Do not invent** `server/services/aiDecisionService.js`. It does not exist.

Client `useAutoplay` **yields** on `general_phase` / `player_phase` so the server AI can run. FULL AUTO still drives setup, Jakub ticks, and event/round transitions.

Simulations (`server/services/simulationService.js`) **duplicate** the place/pass loop; they call `findBestPlacement` + `executePass` themselves. Keep them in sync with live AI, or later route them through `runPlayerAi`.

---

## What to build next (priority)

1. **Commit the hand/pass WIP** after `npm test`.
2. ~~**Give AI kablowanie as an action**~~ Done: place vs +1-minus-fury vs pass.
3. **Strategic pass discard** (which 3 to keep), not random.
4. ~~**Use `currentRound`** in placement~~ Done: endgame value is weighted by `currentRound / 12`.
5. **Look-ahead / opponent leakage**: current scorer subtracts opponent placement points but does not simulate Jakub’s next hunt.
6. **Tests** in `tests/placementHeuristics.test.js` and a dedicated player-AI test for: place vs pass, kablowanie, keep-3, general choice.
7. **Optional:** one simulation path that uses `playerAiService.runPlayerAi` so live games and Monte Carlo share a brain.

Stay inside existing files first. New modules only if a strategy object would otherwise bloat `SharedPlacementManager`.

---

## Hard constraints

1. Vanilla CSS only (`src/assets/css/`). No Tailwind / MUI / Bootstrap.
2. Five locales: `pl`, `en`, `cs`, `uk`, `tlh`. Footer = five flags. Do **not** restore the 110-language picker or run `scripts/` locale generators.
3. `SERVER_URL` stays `''`. Vite proxy targets `127.0.0.1`, not `localhost`.
4. `Dockerfile` Stage 2 must `COPY src/ ./src/` (backend imports `src/strategies/jakubStrategy.js`).
5. `server.listen(PORT)` without `'0.0.0.0'`.
6. Update `docs/openapi.json` when REST routes change.
7. Game-rule numbers live in `shared/constants.js`. `server/constants.js` re-exports it. `server/configs/game_config.json` overrides at runtime.

---

## Commands

```bash
npm install --legacy-peer-deps
npm run server          # http://localhost:3001
npm run dev             # http://localhost:5173
npm test
npm run simulate:parallel
./bash/deploy.sh        # local container http://localhost:7777
```

Release: `.grok/skills/deploy/SKILL.md` (or `/deploy`). Do not invent a second release path.

---

## Doc map

| File | Role |
| :--- | :--- |
| [`docs/PLAYER_AI.md`](docs/PLAYER_AI.md) | Player AI architecture, gaps, file map |
| [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) | Authoritative architecture |
| [`docs/GAME_RULES.md`](docs/GAME_RULES.md) | Rules (Polish) |
| [`GROK.md`](GROK.md) | Assistant navigation map |
| [`docs/STATE_MANAGEMENT.md`](docs/STATE_MANAGEMENT.md) | Socket + autoplay + AI tick |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Always-on Copilot prompt |
