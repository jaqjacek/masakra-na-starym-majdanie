# Player AI — current status (v1.21.0)

Handoff for continuing work on **Herszt / player AI**. Jakub’s rampage AI is documented here only as a neighbor system.

Related: [`COPILOT.md`](../COPILOT.md), [`PROJECT_SPEC.md`](PROJECT_SPEC.md), [`GAME_RULES.md`](GAME_RULES.md), [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md).

---

## 1. Two AIs

| Actor | When | Entry | Maturity |
| :--- | :--- | :--- | :--- |
| **Player AI** (unclaimed Herszt) | `general_phase`, `player_phase` | `server/services/playerAiService.js` | Greedy one-ply. **Active work.** |
| **Jakub AI** | `jakub_phase` | `src/strategies/jakubStrategy.js` `executeJakubStep` | Production. Do not rewrite unless asked. |

Human seats: `state.manualPlayers`. Claimed via `action:claimPlayer` or `joinGame` with `playerId`. Toggle in `PlayersPanel` / `App.jsx`.

---

## 2. Server tick

```text
socket action (placeSet, passTurn, claimPlayer, …)
  → ActionService.handle*
  → persistThenAi (socketHandler.js)
       enqueueGame (one mutation at a time)
       saveFullState
       revealAfterChange
         if another human is watching: emit that human action, wait 5× autoplay tick
         each AI place / pass / kablowanie: emit spectatorAction, wait 5× autoplay tick
         final boardUpdate with spectatorAction: null
```

`runPlayerAi` loops `playOneStep`:

- **`general_phase`:** if current player is not manual and has no general → `GeneralSelectionManager.chooseGeneral` → advance. If everyone has a general → `player_phase` (order = descending points).
- **`player_phase`:** if current player is manual and has not passed → **stop** (wait for human). If already passed → skip. Else `aiPlaceOrPass`. If all passed → `jakub_phase`.
- Other phases: return false (client autoplay / REST handles Jakub, events, scoring).

Human moves arrive as a full `syncState`. The server diffs that state and emits the same `spectatorAction` before AI continues. The field is not saved. The client shows it only with `?player=`, and never for that viewer's own move. An all-AI game does not wait.

Spectator mode is not this live reveal. `server/services/spectatorReplayService.js` clears `manualPlayers`, loops `playOneStep` plus server-side Jakub/event/final scoring, and writes `replay.json`. The client hook `src/hooks/useSpectatorPlayback.js` applies those frames. Do not add sleeps to the recorder.

`resumePlayerAi(gameId, io)` reloads disk state and runs the same queued loop.

---

## 3. Place vs pass (`aiPlaceOrPass`)

1. `ServerPlacementManager.findBestPlacement` → `SharedPlacementManager.findBestPlacement`.
2. If a placement is returned: stamp pawns, award **distributed** placement points to every Herszt, discard the set, log.
3. Else: `selectExcessSetsOnPass(hand)` — random keep ≤ `MAX_SETS_KEPT_ON_PASS` (3); excess `ownerId = 'jakub'` + `applySetToJakubAnger`. **No points.** Mark player passed.

The scorer returns `null` when the best `strategicScore` is negative.

`choosePlayerAction` then compares that placement with voluntary **kablowanie** and pass. Kablowanie is +1 minus the cost of feeding our general and of raising Jakub's range. It does not mark the seat passed, so the player can still place on a later turn. A set with our own pawns is not snitched for +1.

---

## 4. Placement heuristic (`SharedPlacementManager.findBestPlacement`)

For each placeable set × empty region (Jakub-only region counts as empty):

```text
ourPts, opponentsPts  = race scoring (V/W/G/B calculators)
netScore              = ourPts - opponentsPts
threatPenalty         = anger[ourRace] * ourPawns * (AI_THREAT_IN_RANGE_MULTIPLIER 1.5 if dist ≤ range, AI_THREAT_NEAR_RANGE_MULTIPLIER 0.5 if dist ≤ range+1)
endGameValue          = marginal final score of the set (not per tile)
roundWeight           = currentRound / TOTAL_GAME_ROUNDS
strategicScore        = netScore - threatPenalty + endGameValue * roundWeight
```

Place if the best `strategicScore >= 0`. Otherwise pass. The same number ranks candidates and decides place vs pass.

`endGameValue` matches final scoring: vampire +2 for a new region (set-level, not a flat per-tile bonus); ghost +2 solo or +1 if own count beats the largest other race; bardak +1 on the same majority test; werewolf +1 per wolf in the set.

**Gaps**

- No simulation of Jakub’s next hunt / witness / mercy. Endgame value is not zeroed when pawns sit in range.
- No value for keeping a set for the next general.
- Pass discard is random, not “keep my race / starve Jakub”.
- The legacy `isSetAllowedToPass` helper was removed (pass uses `selectExcessSetsOnPass` only).

All AI tuning numbers live in `shared/constants.js` (`AI_*`, `KABLOWANIE_POINTS`, `MAX_PLAYER_AI_STEPS`, `PLAYER_AI_REVEAL_TICKS`, autoplay speed bounds). Change weights there, not inline.

Same function is used by:

- Live server AI (`playerAiService`)
- Client FULL AUTO leftover path (`src/App.jsx` / `ClientPlacementManager`)
- Monte Carlo (`simulationService.js` three runners)

---

## 5. General selection (`GeneralSelectionManager.chooseGeneral`)

Fitness per available race:

- Hand count × `AI_GENERAL_HAND_WEIGHT` (V 2.5, G 2.0, W 1.5, B 1.0)
- Minus `anger[race] * AI_GENERAL_ANGER_PENALTY` (2), extra −`AI_GENERAL_MAIN_TARGET_PENALTY` (5) if that race is Jakub’s max-anger target
- Plus board presence × `AI_GENERAL_BOARD_WEIGHT` (V/W ×1.0, G/B ×0.5)

Picks `argmax`. No information about remaining set deck or next-round catch-up.

---

## 6. Client autoplay relationship

`src/hooks/useAutoplay.js`:

- `JAKUB AUTO`: only `jakub_phase` (and transition when everyone passed).
- `FULL AUTO`: setup (`drawSets`), Jakub ticks, event/round chrome.
- On `general_phase` / `player_phase` the client **returns** and lets the server AI move unclaimed players. Manual players still block until they act.

Do not re-implement player turns on the client. Keep `ClientPlacementManager` as a thin wrapper of `SharedPlacementManager` for UI previews / leftover FULL AUTO.

---

## 7. Simulations

`server/services/simulationService.js` (`runDetailedSimulation`, `runBasicSimulation`, `runFullSimulation`) and `simulationWorker.js` replay a whole game without sockets.

WIP already aligns dealing (+3 from round 2) and pass (no passing points). They still **inline** place/pass instead of calling `runPlayerAi`. When the heuristic grows, either extract a shared `decidePlayerAction(data)` or run `runPlayerAi` against a cloned state so live and sim cannot drift.

Admin UI: `/admin/simulate`. Job API: `POST /api/simulate/job`.

---

## 8. Tests to extend

| File | Covers now |
| :--- | :--- |
| `tests/placementHeuristics.test.js` | Avoid Jakub range; vampire prefers empty region |
| `tests/passingRestriction.test.js` | `selectExcessSetsOnPass` (legacy `isSetAllowedToPass` cases must be dropped) |
| `tests/actionService.test.js` | Pass keep-3 no points; drawSets round 1/2 |
| `tests/generalSelection.test.js` | General picker |
| `tests/simulationWorker.test.js` | Worker plumbing |

Missing: kablowanie-vs-place, AI pass when all placements negative, strategic keep-3, round-12 endgame bonus, “simulation uses the same decision as live AI”.

---

## 9. Suggested implementation order

1. Commit current WIP; `npm test`.
2. ~~Introduce `decidePlayerAction`~~ Done as `SharedPlacementManager.choosePlayerAction`, used by live AI and simulations.
3. ~~Score kablowanie against place and pass.~~ Done. Hand-size value of the kept sets is still not scored.
4. Replace random keep-3 with a keep-value (own race, next-round general, deny Jakub’s hunt).
5. ~~Weight `endGameBonus` by `currentRound / TOTAL_GAME_ROUNDS`.~~ Done in `findBestPlacement`.
6. Add tests before touching weights blindly.
7. Only then consider 2-ply search (expensive; sims run thousands of games).

---

## 10. File map

| Path | Role |
| :--- | :--- |
| `server/services/playerAiService.js` | Live AI loop |
| `server/socketHandler.js` | `persistThenAi`, `claimManualPlayer` |
| `shared/sharedPlacementManager.js` | Heuristic + pass trim |
| `shared/generalSelectionManager.js` | General pick |
| `shared/actions/actionService.js` | Canonical human actions (place, pass, kablowanie, draw) |
| `server/services/serverPlacementManager.js` | Server wrapper + `executePass` |
| `src/logic/clientPlacementManager.js` | Client wrapper |
| `src/strategies/jakubStrategy.js` | Jakub + `applySetToJakubAnger` |
| `server/services/simulationService.js` | Monte Carlo player turns |
| `shared/constants.js` | `INITIAL_SETS_PER_PLAYER`, `SETUP_SETS_PER_PLAYER_PER_ROUND`, `MAX_SETS_KEPT_ON_PASS` |
| `src/hooks/useAutoplay.js` | Client phase driver (yields player turns) |
| `src/components/panels/PlayersPanel.jsx` | Manual/AI seat toggle |
