import fs from 'fs';
import path from 'path';
import { GAMES_DIR, getGameData, saveFullState } from '../gameLogic.js';
import { updateJakubDistance } from '../boardManager.js';
import { GameEventPhaseManager } from '../events/gameEventPhaseManager.js';
import { ActionService } from '../../shared/actions/actionService.js';
import { RACES, RACE_MAP_PL, JAKUB_BASE_RANGE, TOTAL_GAME_ROUNDS, MAX_HISTORY_ENTRIES } from '../../shared/constants.js';
import { MilosierdzieManager } from '../../shared/milosierdzieManager.js';
import { trackPointsChange } from '../../shared/statsManager.js';
import { VampireScoring } from '../../shared/scoring/vampireScoring.js';
import { WerewolfScoring } from '../../shared/scoring/werewolfScoring.js';
import { GhostScoring } from '../../shared/scoring/ghostScoring.js';
import { BardakScoring } from '../../shared/scoring/bardakScoring.js';
import { bumpReplayIndex } from '../../shared/stateRecency.js';
import { playOneStep } from './playerAiService.js';
import { executeJakubStep } from '../../src/strategies/jakubStrategy.js';

const MAX_STEPS = 8000;

export function isSpectatorLocked(data) {
  return data?.spectatorReplay === true || data?.spectatorRecording === true;
}

export function replayPath(gameId) {
  return path.join(GAMES_DIR, String(gameId), 'replay.json');
}

export function readSpectatorReplay(gameId) {
  const file = replayPath(gameId);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
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

function historyDelta(before, after) {
  const remaining = new Map();
  for (const entry of before) {
    const key = JSON.stringify(entry);
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }
  const delta = [];
  for (const entry of after || []) {
    const key = JSON.stringify(entry);
    const left = remaining.get(key) || 0;
    if (left > 0) remaining.set(key, left - 1);
    else delta.push(entry);
  }
  return delta;
}

function replaceState(target, source) {
  if (!source) return;
  for (const key of Object.keys(target)) {
    if (!(key in source)) delete target[key];
  }
  Object.assign(target, source);
}

function frameState(data) {
  const clone = JSON.parse(JSON.stringify(data));
  clone.history = [];
  delete clone.replayLog;
  delete clone.spectatorRecording;
  if (clone.sets) {
    clone.sets = {
      pawns: clone.sets.pawns,
      pawnsInPlayLimit: clone.sets.pawnsInPlayLimit,
      heldSets: [],
      drawPile: [],
      discardPile: []
    };
  }
  if (clone.events) {
    clone.events = { drawn: (clone.events.drawn || []).slice(-1) };
  }
  return clone;
}

function absorbJakubStep(data, step) {
  replaceState(data, step.newState);
  const meta = step.metadata || {};
  const witnessed = meta.swiadekPointsAwarded || [];
  if (step.actionTaken || witnessed.length > 0 || step.log) {
    if (step.log) addLog(data, step.log, meta);
    witnessed.forEach((reward) => {
      const raceName = reward.race === 'vampire' ? 'Wampiry' : reward.race === 'werewolf' ? 'Wilkołaki' : reward.race === 'ghost' ? 'Duchy' : 'Bardaki';
      addLog(data, `🔥 Świadek Jakuba: ${reward.player} (${raceName}) zdobywa ${reward.points} bonusowych punktów za przeżycie w pobliżu Jakuba.`, {
        race: reward.race,
        points: reward.points,
        type: 'witness_points',
        regionId: reward.regionId
      });
    });
  }
  if (meta.magnetism) data.magnetismCount = (data.magnetismCount || 0) + 1;
}

function findJakub(data) {
  for (const region of data.regions || []) {
    if (region.pawns?.jakub?.length > 0) return region.pawns.jakub[0];
  }
  return null;
}

function finishJakubHunt(data) {
  const jakub = findJakub(data);
  addLog(data, 'Jakub kończy swoje łowy.');
  if (jakub && data.mercyActive !== false) {
    const rewards = MilosierdzieManager.applyMercy(jakub, data.players);
    rewards.forEach((reward) => {
      const raceName = reward.race === 'vampire' ? 'Wampiry' : reward.race === 'werewolf' ? 'Wilkołaki' : reward.race === 'ghost' ? 'Duchy' : 'Bardaki';
      addLog(data, `😇 Miłosierdzie Jakuba: ${reward.playerName} (${raceName}) otrzymuje +${reward.points} pkt za pozostałą furię.`, {
        race: reward.race,
        points: reward.points,
        type: 'mercy_points'
      });
      const player = data.players.find((entry) => entry.id === reward.playerId);
      if (player) trackPointsChange(player, reward.race, reward.points, 'mercy');
    });
  }
  if (jakub) {
    jakub.range = JAKUB_BASE_RANGE;
    jakub.movedThisRound = false;
    addLog(data, `Zasięg Jakuba zresetowany do ${JAKUB_BASE_RANGE}.`);
  }
  const discarded = (data.sets?.heldSets || []).filter((set) => set.ownerId === 'jakub');
  discarded.forEach((set) => {
    set.ownerId = null;
    set.used = false;
    if (!data.sets.discardPile) data.sets.discardPile = [];
    data.sets.discardPile.push(set);
  });
  if (data.sets) {
    data.sets.heldSets = (data.sets.heldSets || []).filter((set) => set.ownerId !== 'jakub');
  }
  if (data.regions) updateJakubDistance(data.regions);
  delete data.witnessGlows;

  const total = data.totalRounds || TOTAL_GAME_ROUNDS;
  if ((data.currentRound || 1) >= total) {
    data.phase = 'final_scoring';
    data.currentPlayerIndex = 0;
    addLog(data, '--- FAZA PUNKTACJI KOŃCOWEJ (08:00) ---');
  } else {
    data.phase = 'event_phase';
    addLog(data, '--- FAZA EVENTU ---');
  }
}

function calculateFinalScoring(data) {
  if (!data.history) data.history = [];
  data.players.forEach((player) => {
    const pick = player.generalOf;
    if (!pick) return;
    let added = 0;
    if (pick === 'vampire') added = VampireScoring.calculateFinal(data.regions);
    else if (pick === 'werewolf') added = WerewolfScoring.calculateFinal(data.regions);
    else if (pick === 'ghost') added = GhostScoring.calculateFinal(data.regions);
    else if (pick === 'bardak') added = BardakScoring.calculateFinal(data.regions);
    player.points += added;
    trackPointsChange(player, pick, added, 'final');
    const raceName = RACE_MAP_PL[pick] || pick;
    addLog(data, `Punktacja Końcowa: Gracz ${player.id} (+${added} za bandę ${raceName});`);
  });
  const winner = [...data.players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return RACES.indexOf(a.generalOf) - RACES.indexOf(b.generalOf);
  })[0];
  addLog(data, `KONIEC GRY! Zwycięzca: Gracz ${winner.id} z liczbą punktów: ${winner.points}.`);
}

function advanceEvent(data) {
  const manager = new GameEventPhaseManager(data);
  manager.executePhase();
  const drawn = data.events?.drawn || [];
  const event = drawn.length > 0 ? drawn[drawn.length - 1] : null;
  const total = data.totalRounds || TOTAL_GAME_ROUNDS;
  if ((data.currentRound || 1) < total) {
    data.phase = 'setup';
    data.currentRound += 1;
    data.availableGenerals = [...RACES];
    data.players.forEach((player) => { player.generalOf = null; });
    data.passedPlayers = [];
    data.currentPlayerIndex = 0;
    data.playerOrder = [...data.players].sort((a, b) => a.points - b.points).map((player) => player.id);
    data.turnActionExecuted = false;
    return {
      kind: 'event',
      spectatorAction: event ? { type: 'event', title: event.title, description: event.description, id: event.id } : null,
      event
    };
  }
  data.phase = 'final_scoring';
  calculateFinalScoring(data);
  data.phase = 'End Game';
  data.gameStatus = 'finished';
  data.spectatorReplay = true;
  return {
    kind: 'final',
    spectatorAction: { type: 'final' },
    event
  };
}

function jakubKind(step) {
  const meta = step.metadata || {};
  if (meta.killedInfo?.length) return 'kill';
  if (meta.magnetismPull || meta.magnetismStart || meta.magnetism) return 'magnetism';
  if (step.actionTaken) return 'move';
  return 'jakub';
}

export function recordSpectatorGame(gameId) {
  const existing = readSpectatorReplay(gameId);
  if (existing?.frames?.length) {
    return { ready: true, cached: true, frameCount: existing.frames.length };
  }

  const loaded = getGameData(gameId);
  const data = loaded.data;
  if (data.phase !== 'setup' || (data.currentRound || 1) !== 1 || data.gameStatus === 'finished') {
    throw fail(409, 'Spectator recording is only allowed at the start of a new game');
  }

  data.manualPlayers = [];
  data.spectatorRecording = true;
  const frames = [];
  let previousHistory = JSON.parse(JSON.stringify(data.history || []));

  const push = (kind, extra = {}) => {
    bumpReplayIndex(data, { type: 'spectator', kind });
    const delta = historyDelta(previousHistory, data.history || []);
    previousHistory = JSON.parse(JSON.stringify(data.history || []));
    frames.push({
      index: frames.length,
      kind,
      spectatorAction: extra.spectatorAction || null,
      event: extra.event || null,
      historyDelta: delta,
      state: frameState(data)
    });
  };

  push('start');
  let guard = 0;
  while (data.gameStatus !== 'finished' && guard < MAX_STEPS) {
    guard += 1;
    if (data.phase === 'setup') {
      ActionService.handleDrawSets(data);
      push('draw', {
        spectatorAction: { type: 'draw', round: data.currentRound || 1 }
      });
      continue;
    }
    if (data.phase === 'general_phase' || data.phase === 'player_phase') {
      const step = playOneStep(data);
      if (!step) throw fail(500, `Spectator AI stopped during ${data.phase}`);
      push(step.kind || 'advance', { spectatorAction: step.spectatorAction || null });
      continue;
    }
    if (data.phase === 'jakub_phase') {
      const step = executeJakubStep(data);
      absorbJakubStep(data, step);
      if (step.actionTaken) {
        push(jakubKind(step));
        continue;
      }
      finishJakubHunt(data);
      push('jakub-end');
      continue;
    }
    if (data.phase === 'event_phase') {
      const result = advanceEvent(data);
      push(result.kind, result);
      continue;
    }
    if (data.phase === 'final_scoring') {
      calculateFinalScoring(data);
      data.phase = 'End Game';
      data.gameStatus = 'finished';
      data.spectatorReplay = true;
      push('final', { spectatorAction: { type: 'final' } });
      continue;
    }
    throw fail(500, `Spectator recording cannot handle phase ${data.phase}`);
  }

  if (data.gameStatus !== 'finished') {
    throw fail(500, 'Spectator recording exceeded the step limit');
  }

  delete data.spectatorRecording;
  data.spectatorReplay = true;
  saveFullState(gameId, data);
  const payload = { version: 1, gameId: String(gameId), frames };
  fs.writeFileSync(replayPath(gameId), JSON.stringify(payload));
  return { ready: true, cached: false, frameCount: frames.length };
}
