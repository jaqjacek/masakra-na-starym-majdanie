import { getGameData, saveFullState } from '../gameLogic.js';
import { ServerPlacementManager } from './serverPlacementManager.js';
import { GeneralSelectionManager } from '../../shared/generalSelectionManager.js';
import { SharedPlacementManager } from '../../shared/sharedPlacementManager.js';
import { applySetToJakubAnger } from '../../src/strategies/jakubStrategy.js';
import { trackGeneralSelection, trackPointsChange, trackSetsPlayed } from '../../shared/statsManager.js';
import {
  RACES,
  RACE_MAP_PL,
  RACE_TO_ABBR,
  DEFAULT_PAWN_CONFIGS,
  KABLOWANIE_POINTS,
  MAX_HISTORY_ENTRIES,
  MAX_PLAYER_AI_STEPS,
  PLAYER_AI_REVEAL_TICKS,
  DEFAULT_AUTOPLAY_SPEED_MS,
  MIN_AUTOPLAY_SPEED_MS,
  MAX_AUTOPLAY_SPEED_MS
} from '../../shared/constants.js';

const gameTails = new Map();
const gameAutoplaySpeeds = new Map();

export function isManualPlayer(data, playerId) {
  return (data.manualPlayers || []).some((id) => String(id) === String(playerId));
}

export function claimManualPlayer(data, playerId) {
  if (playerId === null || playerId === undefined || playerId === '') return false;
  if (!data.manualPlayers) data.manualPlayers = [];
  if (isManualPlayer(data, playerId)) return false;
  const numericId = parseInt(playerId, 10);
  data.manualPlayers.push(Number.isNaN(numericId) ? playerId : numericId);
  return true;
}

function addLog(data, text, metadata = {}) {
  if (!data.history) data.history = [];
  data.history.push({
    time: new Date().toLocaleTimeString(),
    text,
    ...metadata
  });
  if (data.history.length > MAX_HISTORY_ENTRIES) {
    data.history = data.history.slice(data.history.length - MAX_HISTORY_ENTRIES);
  }
}

function raceLabel(race) {
  return RACE_MAP_PL[race] || race;
}

function findJakub(data) {
  for (const r of data.regions || []) {
    if (r.pawns?.jakub?.length > 0) return r.pawns.jakub[0];
  }
  return null;
}

function currentPlayer(data) {
  const curId = data.playerOrder?.[data.currentPlayerIndex];
  if (curId === null || curId === undefined) return { curId: null, curPlayer: null };
  const curPlayer = (data.players || []).find((p) => p.id !== null && p.id !== undefined && String(p.id) === String(curId));
  return { curId, curPlayer };
}

function advanceTurn(data) {
  if (!data.playerOrder?.length) return;
  data.currentPlayerIndex = (data.currentPlayerIndex + 1) % data.playerOrder.length;
}

function maybeStartJakubPhase(data) {
  if (data.players && data.passedPlayers && data.passedPlayers.length === data.players.length) {
    data.phase = 'jakub_phase';
    addLog(data, `--- Start Fazy Jakuba ---`);
    return true;
  }
  return false;
}

function chooseGeneralFor(data, curId, curPlayer) {
  const hand = (data.sets?.heldSets || []).filter((s) => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(curId));
  const pick = GeneralSelectionManager.chooseGeneral(
    data.availableGenerals,
    hand,
    data.regions,
    data.sets?.pawns
  );
  if (!pick) return false;
  curPlayer.generalOf = pick;
  data.availableGenerals = (data.availableGenerals || []).filter((g) => g !== pick);
  trackGeneralSelection(curPlayer, pick);
  addLog(data, `Gracz ${curId} wybrał Generała bandy: ${raceLabel(pick)}`);
  return true;
}

function startPlayerPhase(data) {
  data.phase = 'player_phase';
  data.currentPlayerIndex = 0;
  data.passedPlayers = [];
  data.turnActionExecuted = false;
  data.playerOrder = [...data.players].sort((a, b) => b.points - a.points).map((p) => p.id);
  addLog(data, `--- Start Fazy Graczy (Runda ${data.currentRound}) ---`);
}

function playerRevealName(data, playerId) {
  const player = (data.players || []).find((p) => String(p.id) === String(playerId));
  return player?.name || String(playerId);
}

function angerSnapshot(jakub) {
  if (!jakub) return { anger: null, range: null };
  return { anger: { ...(jakub.anger || {}) }, range: jakub.range };
}

function aiKablowanie(data, curId, curPlayer, set) {
  curPlayer.points += KABLOWANIE_POINTS;
  trackPointsChange(curPlayer, curPlayer.generalOf, KABLOWANIE_POINTS, 'passing');
  set.ownerId = 'jakub';
  set.angerApplied = true;
  const jakub = findJakub(data);
  if (jakub) {
    const result = applySetToJakubAnger(jakub, set.content || {});
    jakub.anger = result.anger;
    jakub.range = result.range;
    addLog(data, `Gracz ${curId} podkablował Jakubowi zestawem ${set.id}. Furia zaktualizowana | Range: ${jakub.range}`);
  } else {
    addLog(data, `Gracz ${curId} podkablował Jakubowi zestawem ${set.id} za 1 pkt.`);
  }
  const fury = angerSnapshot(jakub);
  return {
    type: 'kablowanie',
    playerId: curId,
    playerName: playerRevealName(data, curId),
    setId: set.id,
    setContent: { ...(set.content || {}) },
    anger: fury.anger,
    range: fury.range
  };
}

function aiPlaceOrPass(data, curId, curPlayer) {
  const globalPool = { ...(data.sets?.pawns || {}) };
  const playLimits = data.sets?.pawnsInPlayLimit || globalPool;
  const heldSets = data.sets?.heldSets || [];
  const best = ServerPlacementManager.findBestPlacement(
    data.regions,
    heldSets,
    curId,
    curPlayer.generalOf,
    globalPool,
    playLimits,
    data.currentRound
  );
  const hand = heldSets.filter((s) => String(s.ownerId) === String(curPlayer.id));
  const action = SharedPlacementManager.choosePlayerAction(best, hand, findJakub(data), curPlayer.generalOf);

  if (action.type === 'kablowanie') {
    return aiKablowanie(data, curId, curPlayer, action.set);
  }

  if (action.type === 'place' && best) {
    const targetRegion = data.regions[best.region.id] || data.regions.find((r) => r.id === best.region.id);
    if (!targetRegion) return;
    Object.entries(best.set.content).forEach(([tId, count]) => {
      if (!targetRegion.pawns[tId]) targetRegion.pawns[tId] = [];
      const pawnConfig = DEFAULT_PAWN_CONFIGS[tId] || { defaultStatuses: ['ENABLED'] };
      for (let i = 0; i < count; i++) {
        targetRegion.pawns[tId].push({
          statuses: [...(pawnConfig.defaultStatuses || ['ENABLED'])],
          ...(pawnConfig.defaultParameters ? JSON.parse(JSON.stringify(pawnConfig.defaultParameters)) : {})
        });
      }
    });

    const logParts = [];
    const scores = [];
    data.players.forEach((p) => {
      if (!p.generalOf) return;
      const abbr = RACE_TO_ABBR[p.generalOf];
      const racePts = best.allScores?.[abbr] || 0;
      if (racePts !== 0) {
        p.points += racePts;
        trackPointsChange(p, p.generalOf, racePts, 'placement');
        logParts.push(`${abbr}:${racePts > 0 ? '+' : ''}${racePts}`);
        scores.push({ race: p.generalOf, abbr, points: racePts });
      }
    });

    const idx = heldSets.findIndex((s) => String(s.id) === String(best.set.id));
    if (idx !== -1) {
      const used = heldSets.splice(idx, 1)[0];
      used.ownerId = null;
      used.used = false;
      if (!data.sets.discardPile) data.sets.discardPile = [];
      data.sets.discardPile.push(used);
    }

    const statusLog = RACES.map((race) => {
      const count = data.regions.reduce((sum, r) => sum + (r.pawns[race]?.length || 0), 0);
      const limit = playLimits[race] || 0;
      return `${race[0].toUpperCase()}:${count}/${limit}`;
    }).join(' ');

    trackSetsPlayed(curPlayer, curPlayer.generalOf, 1);
    addLog(data, `Gracz ${curId} wystawił Zestaw ${best.set.id} w sektorze [${best.region.x},${best.region.y}] [${logParts.join(', ')}] | Plansza: ${statusLog}`);
    return {
      type: 'place',
      playerId: curId,
      playerName: playerRevealName(data, curId),
      regionId: targetRegion.id,
      x: targetRegion.x,
      y: targetRegion.y,
      setId: best.set.id,
      scores
    };
  }

  let jakub = findJakub(data);
  const currentHand = (data.sets.heldSets || []).filter((s) => String(s.ownerId) === String(curPlayer.id));
  const toDiscard = SharedPlacementManager.selectExcessSetsOnPass(currentHand);
  toDiscard.forEach((s) => {
    s.ownerId = 'jakub';
    if (jakub) {
      const result = applySetToJakubAnger(jakub, s.content);
      jakub.anger = result.anger;
      jakub.range = result.range;
    }
  });
  if (!data.passedPlayers) data.passedPlayers = [];
  if (!data.passedPlayers.some((id) => String(id) === String(curPlayer.id))) {
    data.passedPlayers.push(curPlayer.id);
  }
  if (toDiscard.length > 0) {
    addLog(data, `Gracz ${curId} spasował i oddał ${toDiscard.length} nadmiarowych zestawów Jakubowi (bez punktów). Furia Jakuba zaktualizowana.`);
  } else {
    addLog(data, `Gracz ${curId} spasował.`);
  }
  return {
    type: 'pass',
    playerId: curId,
    playerName: playerRevealName(data, curId)
  };
}

export function playOneStep(data) {
  if (data.gameStatus === 'finished') return false;

  if (data.phase === 'general_phase') {
    if ((data.players || []).every((p) => p.generalOf)) {
      startPlayerPhase(data);
      return { kind: 'phase' };
    }
    const { curId, curPlayer } = currentPlayer(data);
    if (!curPlayer) return false;
    if (isManualPlayer(data, curId)) return false;
    if (curPlayer.generalOf) {
      advanceTurn(data);
      return { kind: 'advance' };
    }
    if (!chooseGeneralFor(data, curId, curPlayer)) return false;
    const spectatorAction = {
      type: 'general',
      playerId: curId,
      playerName: playerRevealName(data, curId),
      race: curPlayer.generalOf
    };
    advanceTurn(data);
    return { kind: 'general', spectatorAction };
  }

  if (data.phase === 'player_phase') {
    const { curId, curPlayer } = currentPlayer(data);
    if (!curPlayer) return false;
    if (isManualPlayer(data, curId) && !(data.passedPlayers || []).some((id) => String(id) === String(curId))) {
      return false;
    }
    if ((data.passedPlayers || []).some((id) => String(id) === String(curId))) {
      advanceTurn(data);
      return { kind: 'advance' };
    }
    if (!curPlayer.generalOf) {
      if (!chooseGeneralFor(data, curId, curPlayer)) return false;
      const spectatorAction = {
        type: 'general',
        playerId: curId,
        playerName: playerRevealName(data, curId),
        race: curPlayer.generalOf
      };
      advanceTurn(data);
      return { kind: 'general', spectatorAction };
    }
    const spectatorAction = aiPlaceOrPass(data, curId, curPlayer);
    if (!maybeStartJakubPhase(data)) {
      advanceTurn(data);
    }
    data.turnActionExecuted = false;
    return {
      kind: spectatorAction?.type || 'player',
      spectatorAction: spectatorAction || null
    };
  }

  return false;
}

export function runPlayerAi(data) {
  let steps = 0;
  let changed = false;
  while (steps < MAX_PLAYER_AI_STEPS) {
    if (!playOneStep(data)) break;
    changed = true;
    steps += 1;
  }
  return changed;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function hasOtherHuman(data, actorId) {
  return (data.manualPlayers || []).some((id) => String(id) !== String(actorId));
}

function clampAutoplaySpeed(speed) {
  const n = Number(speed);
  if (!Number.isFinite(n)) return DEFAULT_AUTOPLAY_SPEED_MS;
  return Math.min(MAX_AUTOPLAY_SPEED_MS, Math.max(MIN_AUTOPLAY_SPEED_MS, Math.round(n)));
}

export function noteAutoplaySpeed(gameId, speed) {
  if (gameId === null || gameId === undefined || gameId === '') return;
  gameAutoplaySpeeds.set(String(gameId), clampAutoplaySpeed(speed));
}

export function revealDelayMs(gameId) {
  return (gameAutoplaySpeeds.get(String(gameId)) || DEFAULT_AUTOPLAY_SPEED_MS) * PLAYER_AI_REVEAL_TICKS;
}

function emitBoard(io, gameId, data, spectatorAction) {
  if (!io) return;
  const stamped = spectatorAction
    ? {
      ...spectatorAction,
      revealId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      revealMs: revealDelayMs(gameId)
    }
    : null;
  io.to(`game:${gameId}`).emit('boardUpdate', { ...data, spectatorAction: stamped });
}

export async function revealAfterChange(gameId, io, data, openingAction) {
  const reveal = (data.manualPlayers || []).length > 0;
  if (reveal && openingAction && io && hasOtherHuman(data, openingAction.playerId)) {
    saveFullState(gameId, data);
    emitBoard(io, gameId, data, openingAction);
    await sleep(revealDelayMs(gameId));
  }

  let steps = 0;
  while (steps < MAX_PLAYER_AI_STEPS) {
    const step = playOneStep(data);
    if (!step) break;
    steps += 1;
    if (reveal && step.spectatorAction && io) {
      saveFullState(gameId, data);
      emitBoard(io, gameId, data, step.spectatorAction);
      await sleep(revealDelayMs(gameId));
    }
  }

  saveFullState(gameId, data);
  emitBoard(io, gameId, data, null);
  return data;
}

export function enqueueGame(gameId, task) {
  const key = String(gameId);
  const prev = gameTails.get(key) || Promise.resolve();
  const run = prev.catch(() => {}).then(() => task());
  const tracked = run.finally(() => {
    if (gameTails.get(key) === tracked) gameTails.delete(key);
  });
  gameTails.set(key, tracked);
  return tracked;
}

export function afterGameChange(gameId, io, data, openingAction) {
  return enqueueGame(gameId, () => revealAfterChange(gameId, io, data, openingAction));
}

export function pointsSnapshot(data) {
  return (data.players || []).map((p) => ({ id: p.id, points: p.points, generalOf: p.generalOf }));
}

export function describeHumanAction(data, kind, { playerId, setId, toIndex, beforePoints }) {
  const base = { type: kind, playerId, playerName: playerRevealName(data, playerId) };
  if (kind === 'pass') return base;
  if (kind === 'kablowanie') {
    const set = (data.sets?.heldSets || []).find((s) => String(s.id) === String(setId));
    const fury = angerSnapshot(findJakub(data));
    return {
      ...base,
      setId,
      setContent: { ...(set?.content || {}) },
      anger: fury.anger,
      range: fury.range
    };
  }
  const region = data.regions?.[toIndex] || (data.regions || []).find((r) => r.id === toIndex);
  const scores = [];
  (data.players || []).forEach((p) => {
    const prev = (beforePoints || []).find((row) => String(row.id) === String(p.id));
    if (!prev || !p.generalOf) return;
    const delta = p.points - prev.points;
    if (delta !== 0) scores.push({ race: p.generalOf, abbr: RACE_TO_ABBR[p.generalOf], points: delta });
  });
  return {
    ...base,
    regionId: region?.id,
    x: region?.x,
    y: region?.y,
    setId,
    scores
  };
}

function findPlacementRegion(previous, next, content) {
  const prevRegions = previous.regions || [];
  const nextRegions = next.regions || [];
  for (let i = 0; i < nextRegions.length; i += 1) {
    const before = prevRegions[i]?.pawns || {};
    const after = nextRegions[i]?.pawns || {};
    const races = Object.entries(content).filter(([, count]) => count > 0);
    if (races.length === 0) continue;
    const matches = races.every(([race, count]) => ((after[race]?.length || 0) - (before[race]?.length || 0)) === count);
    if (matches) return nextRegions[i];
  }
  return null;
}

function pointDeltas(previous, next) {
  const scores = [];
  (next.players || []).forEach((player) => {
    const prev = (previous.players || []).find((row) => String(row.id) === String(player.id));
    if (!prev || !player.generalOf) return;
    const delta = player.points - prev.points;
    if (delta !== 0) {
      scores.push({ race: player.generalOf, abbr: RACE_TO_ABBR[player.generalOf], points: delta });
    }
  });
  return scores;
}

export function describeSyncedAction(previous, next) {
  if (!previous?.players || !next?.players) return null;
  const prevPassed = new Set((previous.passedPlayers || []).map(String));
  const newlyPassed = (next.passedPlayers || []).filter((id) => !prevPassed.has(String(id)));
  if (newlyPassed.length === 1) {
    return {
      type: 'pass',
      playerId: newlyPassed[0],
      playerName: playerRevealName(next, newlyPassed[0])
    };
  }
  if (newlyPassed.length > 1) return null;

  const nextHeld = new Map((next.sets?.heldSets || []).map((set) => [String(set.id), set]));
  const nextDiscard = new Map((next.sets?.discardPile || []).map((set) => [String(set.id), set]));
  const snitched = [];
  const placed = [];
  (previous.sets?.heldSets || []).forEach((prev) => {
    if (prev.ownerId === null || prev.ownerId === undefined || String(prev.ownerId) === 'jakub') return;
    const held = nextHeld.get(String(prev.id));
    const discarded = nextDiscard.get(String(prev.id));
    if (held && String(held.ownerId) === 'jakub') snitched.push({ prev, set: held });
    if (!held && discarded) placed.push({ prev, set: discarded });
  });

  if (snitched.length === 1 && placed.length === 0) {
    const { prev, set } = snitched[0];
    const fury = angerSnapshot(findJakub(next));
    return {
      type: 'kablowanie',
      playerId: prev.ownerId,
      playerName: playerRevealName(next, prev.ownerId),
      setId: set.id,
      setContent: { ...(set.content || prev.content || {}) },
      anger: fury.anger,
      range: fury.range
    };
  }

  if (placed.length === 1 && snitched.length === 0) {
    const { prev, set } = placed[0];
    const region = findPlacementRegion(previous, next, set.content || prev.content || {});
    return {
      type: 'place',
      playerId: prev.ownerId,
      playerName: playerRevealName(next, prev.ownerId),
      regionId: region?.id,
      x: region?.x,
      y: region?.y,
      setId: set.id,
      scores: pointDeltas(previous, next)
    };
  }

  return null;
}

export function resumePlayerAi(gameId, io) {
  return enqueueGame(gameId, () => {
    const { data } = getGameData(gameId);
    return revealAfterChange(gameId, io, data);
  });
}
