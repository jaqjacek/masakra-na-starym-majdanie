# State Management & Data Flow

Current release: **v1.20.2**. Player AI: [`PLAYER_AI.md`](PLAYER_AI.md).

## 1. Global state

Authoritative state lives on the Node server as JSON under `server/games/{id}/` (`map.json`, `players.json`, `sets.json`, `state.json`, `events.json`, `history.json`).

### `useGameState` (`src/hooks/useGameState.js`)

- Joins Socket.io room `game:{id}`.
- Listens for `boardUpdate` (and legacy `gameState` / `gameHistory` if present).
- `updateGameWithSync` / `dispatchAction` send semantic `action:*` events. Server validates via `ActionService`, persists, runs **player AI**, broadcasts `boardUpdate`.
- Incoming client dumps on `action:syncState` are rejected when stale (`shared/stateRecency.js`).

Key session fields: `phase`, `currentRound`, `playerOrder`, `currentPlayerIndex`, `passedPlayers`, `manualPlayers`, `availableGenerals`, `turnActionExecuted`, `gameStatus`.

Player IDs may be number or string — compare with `String(id)`.

## 2. `App.jsx`

Local UI: hover, `visualEffects`, end-game modal, `autoClickNext`.

- `useGameInteraction` — clicks, drag-and-drop, place, kablowanie.
- `useAutoplay` — Jakub ticks + FULL AUTO chrome. **Yields** on `general_phase` / `player_phase` so `playerAiService` can move unclaimed seats.
- `manualPlayers` — seats claimed as human. Toggle writes state and `action:claimPlayer`.

## 3. Server player AI tick

Every successful socket action:

```text
ActionService.handle*
  → saveFullState
  → playerAiService.afterGameChange → runPlayerAi (≤200 steps)
  → io.to(`game:{id}`).emit('boardUpdate')
```

Unclaimed current player: pick general or `aiPlaceOrPass`. Manual current player: loop stops. All passed: `phase = jakub_phase`.

## 4. Autoplay & Jakub

`useAutoplay` still drives `jakub_phase` via `executeJakubStep` (`src/strategies/jakubStrategy.js`) and setup `drawSets`.

Jakub step contract: `{ newState, actionTaken, log, metadata }`. Magnetism uses `jakubMagnetismPending` / `magnetismPullRegions`. Witness logs use `type: 'witness_points'`.

## 5. Visual effects observers (`App.jsx`)

1. Pawn-count drop → explosion + floating text, unless `magnetismPullRegions` contains the region.
2. New history rows: `witness_points` → +1 float; `magnetismStart` → Magnetyzm banner.

## 6. Dealing and pass (WIP in working tree)

| Moment | Rule |
| :--- | :--- |
| `gameService.initializeGame` | Deal `initialSetsPerPlayer` (**5**) |
| Round 1 `handleDrawSets` | No player sets; Jakub draws 2 |
| Round 2+ `handleDrawSets` | Each player **+3** sets (append) |
| Pass | Keep ≤3 at random; excess to Jakub, 0 points |
| Kablowanie | +1 point, fury updates |

Constants: `shared/constants.js`. Runtime: `server/configs/game_config.json`.
