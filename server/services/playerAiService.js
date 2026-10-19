import { getGameData, saveFullState } from '../gameLogic.js';
import { ServerPlacementManager } from './serverPlacementManager.js';
import { GeneralSelectionManager } from '../../shared/generalSelectionManager.js';
import { SharedPlacementManager } from '../../shared/sharedPlacementManager.js';
import { applySetToJakubAnger } from '../../src/strategies/jakubStrategy.js';
import { trackGeneralSelection, trackPointsChange, trackSetsPlayed } from '../../shared/statsManager.js';
import { RACES, RACE_MAP_PL, RACE_TO_ABBR, DEFAULT_PAWN_CONFIGS } from '../../shared/constants.js';

const MAX_AI_STEPS = 200;
const runningGames = new Set();

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
  if (data.history.length > 100) {
    data.history = data.history.slice(data.history.length - 100);
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

function aiPlaceOrPass(data, curId, curPlayer) {
  const globalPool = { ...(data.sets?.pawns || {}) };
  const playLimits = data.sets?.pawnsInPlayLimit || globalPool;
  const best = ServerPlacementManager.findBestPlacement(
    data.regions,
    data.sets?.heldSets || [],
    curId,
    curPlayer.generalOf,
    globalPool,
    playLimits,
    data.currentRound
  );

  if (best) {
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
    data.players.forEach((p) => {
      if (!p.generalOf) return;
      const abbr = RACE_TO_ABBR[p.generalOf];
      const racePts = best.allScores?.[abbr] || 0;
      if (racePts !== 0) {
        p.points += racePts;
        trackPointsChange(p, p.generalOf, racePts, 'rambo');
        logParts.push(`${abbr}:${racePts > 0 ? '+' : ''}${racePts}`);
      }
    });

    const heldSets = data.sets.heldSets || [];
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
    return;
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
}

function playOneStep(data) {
  if (data.gameStatus === 'finished') return false;

  if (data.phase === 'general_phase') {
    if ((data.players || []).every((p) => p.generalOf)) {
      startPlayerPhase(data);
      return true;
    }
    const { curId, curPlayer } = currentPlayer(data);
    if (!curPlayer) return false;
    if (isManualPlayer(data, curId)) return false;
    if (curPlayer.generalOf) {
      advanceTurn(data);
      return true;
    }
    chooseGeneralFor(data, curId, curPlayer);
    advanceTurn(data);
    return true;
  }

  if (data.phase === 'player_phase') {
    const { curId, curPlayer } = currentPlayer(data);
    if (!curPlayer) return false;
    if (isManualPlayer(data, curId) && !(data.passedPlayers || []).some((id) => String(id) === String(curId))) {
      return false;
    }
    if ((data.passedPlayers || []).some((id) => String(id) === String(curId))) {
      advanceTurn(data);
      return true;
    }
    if (!curPlayer.generalOf) {
      chooseGeneralFor(data, curId, curPlayer);
      advanceTurn(data);
      return true;
    }
    aiPlaceOrPass(data, curId, curPlayer);
    if (!maybeStartJakubPhase(data)) {
      advanceTurn(data);
    }
    data.turnActionExecuted = false;
    return true;
  }

  return false;
}

export function runPlayerAi(data) {
  let steps = 0;
  let changed = false;
  while (steps < MAX_AI_STEPS) {
    if (!playOneStep(data)) break;
    changed = true;
    steps += 1;
  }
  return changed;
}

export function afterGameChange(gameId, io, data) {
  const key = String(gameId);
  if (runningGames.has(key)) return data;
  runningGames.add(key);
  try {
    runPlayerAi(data);
    saveFullState(gameId, data);
    if (io) io.to(`game:${gameId}`).emit('boardUpdate', data);
    return data;
  } finally {
    runningGames.delete(key);
  }
}

export function resumePlayerAi(gameId, io) {
  const { data } = getGameData(gameId);
  return afterGameChange(gameId, io, data);
}
