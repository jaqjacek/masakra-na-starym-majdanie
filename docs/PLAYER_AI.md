# Player AI — current status (v1.20.2)

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
       saveFullState
       afterGameChange → runPlayerAi (max 200 steps)
       emit boardUpdate
```

`runPlayerAi` loops `playOneStep`:

- **`general_phase`:** if current player is not manual and has no general → `GeneralSelectionManager.chooseGeneral` → advance. If everyone has a general → `player_phase` (order = descending points).
- **`player_phase`:** if current player is manual and has not passed → **stop** (wait for human). If already passed → skip. Else `aiPlaceOrPass`. If all passed → `jakub_phase`.
- Other phases: return false (client autoplay / REST handles Jakub, events, scoring).

`resumePlayerAi(gameId, io)` reloads disk state and runs the same loop.

---

## 3. Place vs pass (`aiPlaceOrPass`)

1. `ServerPlacementManager.findBestPlacement` → `SharedPlacementManager.findBestPlacement`.
2. If a placement is returned: stamp pawns, award **distributed** placement points to every Herszt, discard the set, log.
3. Else: `selectExcessSetsOnPass(hand)` — random keep ≤ `MAX_SETS_KEPT_ON_PASS` (3); excess `ownerId = 'jakub'` + `applySetToJakubAnger`. **No points.** Mark player passed.

The scorer may return `null` when `utilityPlace < 0` (weak/negative placement), which forces a pass.

Voluntary **kablowanie** (`ActionService.handleKablowanieSet`, +1 point) is **not** in this loop.

---

## 4. Placement heuristic (`SharedPlacementManager.findBestPlacement`)

For each placeable set × empty region (Jakub-only region counts as empty):

```text
ourPts, opponentsPts  = race scoring (V/W/G/B calculators)
netScore              = ourPts - opponentsPts
threatPenalty         = anger[ourRace] * ourPawns * (1.5 if dist ≤ range, 0.5 if dist ≤ range+1)
endGameBonus          = race-specific (vampire spread, ghost solo/majority, bardak majority, werewolf volume)
strategicScore        = netScore - threatPenalty + endGameBonus
```

Then `utilityPlace = pointsFromPlace + ownPawnsCount + min(0, netScore) * 0.5`. Negative utility → skip (pass) unless the hand has no own-race pawns and opponents would also score ≤ 0.

**Gaps**

- `currentRound` is an argument and is unused.
- No simulation of Jakub’s next hunt / witness / mercy.
- No value for keeping a set for the next general.
- No kablowanie candidate (+1 vs place vs pass).
- Pass discard is random, not “keep my race / starve Jakub”.
- `isSetAllowedToPass` still exists (majority anger vs board count) but **pass no longer uses it**.

Same function is used by:

- Live server AI (`playerAiService`)
- Client FULL AUTO leftover path (`src/App.jsx` / `ClientPlacementManager`)
- Monte Carlo (`simulationService.js` three runners)

---

## 5. General selection (`GeneralSelectionManager.chooseGeneral`)

Fitness per available race:

- Hand count × multiplier (V 2.5, G 2.0, W 1.5, B 1.0)
- Minus `anger[race] * 2`, extra −5 if that race is Jakub’s max-anger target
- Plus board presence (V/W ×1.0, G/B ×0.5)

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
| `tests/passingRestriction.test.js` | `isSetAllowedToPass` (legacy) + `selectExcessSetsOnPass` |
| `tests/actionService.test.js` | Pass keep-3 no points; drawSets round 1/2 |
| `tests/generalSelection.test.js` | General picker |
| `tests/simulationWorker.test.js` | Worker plumbing |

Missing: kablowanie-vs-place, AI pass when all placements negative, strategic keep-3, round-12 endgame bonus, “simulation uses the same decision as live AI”.

---

## 9. Suggested implementation order

1. Commit current WIP; `npm test`.
2. Introduce `decidePlayerAction(data, player)` returning `{ type: 'place'|'kablowanie'|'pass', … }` used by `playerAiService` (and later sims).
3. Score kablowanie (+1, fury gift to Jakub, hand size) against place and pass.
4. Replace random keep-3 with a keep-value (own race, next-round general, deny Jakub’s hunt).
5. Weight `endGameBonus` by `currentRound / TOTAL_GAME_ROUNDS`.
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
