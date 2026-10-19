import { RACES, RACE_TO_ABBR, DEFAULT_PAWN_CONFIGS, SETUP_SETS_PER_PLAYER_PER_ROUND, JAKUB_SETS_PER_ROUND } from '../constants.js';
import { SharedPlacementManager } from '../sharedPlacementManager.js';
import { Scoring } from '../scoring/scoring.js';
import { applySetToJakubAnger } from '../../src/strategies/jakubStrategy.js';
import { trackPointsChange, trackGeneralSelection, trackSetsPlayed } from '../statsManager.js';

const getTime = () => new Date().toLocaleTimeString();

function addLog(data, text, metadata = {}) {
  if (!data.history) data.history = [];
  data.history.push({
    time: getTime(),
    text,
    ...metadata
  });
  if (data.history.length > 50) {
    data.history = data.history.slice(data.history.length - 50);
  }
}

function findAndRemoveSetById(data, setId, ownerId) {
  if (!data.sets) return null;
  if (ownerId && data.sets.heldSets) {
    const idx = data.sets.heldSets.findIndex(s => s.id === setId && String(s.ownerId) === String(ownerId));
    if (idx !== -1) {
      return data.sets.heldSets.splice(idx, 1)[0];
    }
  }
  if (data.sets.drawnSets) {
    const idx = data.sets.drawnSets.findIndex(s => s.id === setId);
    if (idx !== -1) {
      return data.sets.drawnSets.splice(idx, 1)[0];
    }
  }
  if (data.sets.heldSets) {
    const idx = data.sets.heldSets.findIndex(s => s.id === setId);
    if (idx !== -1) {
      return data.sets.heldSets.splice(idx, 1)[0];
    }
  }
  return null;
}

export class ActionService {
  /**
   * Select a general race for a player.
   */
  static handleSelectGeneral(data, { playerId, race }) {
    const player = data.players.find(p => String(p.id) === String(playerId));
    if (!player) throw new Error('Player not found');

    const oldRace = player.generalOf;
    if (oldRace) {
      data.availableGenerals.push(oldRace);
    }

    player.generalOf = race;
    data.availableGenerals = data.availableGenerals.filter(r => r !== race);

    trackGeneralSelection(player, race);
    addLog(data, `Gracz ${playerId} wybrał Generała: ${race}`);
    return data;
  }

  /**
   * Place a set onto a board region.
   */
  static handlePlaceSet(data, { playerId, setId, toIndex }) {
    const targetRegion = data.regions[toIndex];
    if (!targetRegion) throw new Error('Invalid target region');

    // Find set
    let setObj = null;
    if (data.sets?.heldSets) {
      setObj = data.sets.heldSets.find(s => s.id === setId);
    }
    if (!setObj && data.sets?.drawnSets) {
      setObj = data.sets.drawnSets.find(s => s.id === setId);
    }
    if (!setObj) throw new Error('Set not found');

    const placementScores = Scoring.calculatePlacementPoints(data.regions, targetRegion, setObj.content);
    
    const playerGains = {};
    data.players.forEach(p => {
      if (p.generalOf) {
        const abbr = RACE_TO_ABBR[p.generalOf];
        const racePts = placementScores[abbr] || 0;
        if (racePts !== 0) {
          p.points += racePts;
          trackPointsChange(p, p.generalOf, racePts, 'rambo');
          playerGains[p.generalOf] = racePts;
        }
      }
    });

    const RACES_ORDER = ['vampire', 'werewolf', 'ghost', 'bardak'];
    const logSummary = [];
    RACES_ORDER.forEach(race => {
      if (playerGains[race] !== undefined) {
        const racePts = playerGains[race];
        const abbr = RACE_TO_ABBR[race];
        logSummary.push(`${abbr}:${racePts > 0 ? '+' : ''}${racePts}`);
      }
    });

    Object.entries(setObj.content).forEach(([tId, count]) => {
      if (!targetRegion.pawns[tId]) targetRegion.pawns[tId] = [];
      const pawnConfig = DEFAULT_PAWN_CONFIGS[tId] || { defaultStatuses: ['ENABLED'] };
      for (let i = 0; i < count; i++) {
        targetRegion.pawns[tId].push({ 
          statuses: [...(pawnConfig.defaultStatuses || ['ENABLED'])], 
          ...(pawnConfig.defaultParameters ? JSON.parse(JSON.stringify(pawnConfig.defaultParameters)) : {}) 
        });
      }
    });

    const usedSet = findAndRemoveSetById(data, setObj.id, setObj.ownerId);
    if (usedSet) {
      usedSet.ownerId = null;
      usedSet.used = false;
      if (!data.sets.discardPile) data.sets.discardPile = [];
      data.sets.discardPile.push(usedSet);
    }

    const limits = data.sets?.pawnsInPlayLimit || data.sets?.pawns || {};
    const statusLog = RACES.map(race => {
      const count = data.regions.reduce((sum, r) => sum + (r.pawns[race]?.length || 0), 0);
      const limit = limits[race] || 0;
      return `${race[0].toUpperCase()}:${count}/${limit}`;
    }).join(' ');

    addLog(data, `Ręcznie: Zestaw ${setId} wystawiony w sektorze [${targetRegion.x},${targetRegion.y}] [${logSummary.join(', ')}] | Plansza: ${statusLog}`);

    const curPlayer = data.players.find(p => String(p.id) === String(playerId));
    if (curPlayer && curPlayer.generalOf) {
      trackSetsPlayed(curPlayer, curPlayer.generalOf, 1);
    }

    if (data.playerOrder && data.playerOrder.length > 0) {
      let nextIdx = (data.currentPlayerIndex + 1) % data.playerOrder.length;
      let safety = 0;
      while (data.passedPlayers && data.passedPlayers.includes(data.playerOrder[nextIdx]) && safety < 10) {
        nextIdx = (nextIdx + 1) % data.playerOrder.length;
        safety++;
      }
      data.currentPlayerIndex = nextIdx;
    }
    if (data.passedPlayers && data.passedPlayers.length === data.players.length) {
      data.phase = 'jakub_phase';
      addLog(data, `--- Start Fazy Jakuba ---`);
    }

    data.turnActionExecuted = false;
    return data;
  }

  /**
   * Pass / Sell a set to Jakub (Kablowanie).
   */
  static handleKablowanieSet(data, { playerId, setId }) {
    let setObj = null;
    if (data.sets?.heldSets) {
      setObj = data.sets.heldSets.find(s => s.id === setId);
    }
    if (!setObj && data.sets?.drawnSets) {
      setObj = data.sets.drawnSets.find(s => s.id === setId);
    }
    if (!setObj) throw new Error('Set not found');

    const ownerId = setObj.ownerId || playerId;
    const playerIdx = ownerId ? data.players.findIndex(p => String(p.id) === String(ownerId)) : -1;

    const s = findAndRemoveSetById(data, setObj.id, ownerId);
    if (s) {
      if (playerIdx !== -1) {
        const p = data.players[playerIdx];
        p.points += 1;
        trackPointsChange(p, p.generalOf, 1, 'passing');
      }
      s.ownerId = 'jakub';
      if (!data.sets.heldSets) data.sets.heldSets = [];
      data.sets.heldSets.push(s);

      let jakub = null;
      for (const r of data.regions) {
        if (r.pawns.jakub?.length > 0) {
          jakub = r.pawns.jakub[0];
          break;
        }
      }
      if (jakub) {
        const result = applySetToJakubAnger(jakub, s.content);
        jakub.anger = result.anger;
        jakub.range = result.range;
        addLog(data, `Gracz ${ownerId || playerId} podkablował Jakubowi zestawem ${s.id}. Furia zaktualizowana | Range: ${jakub.range}`);
      } else {
        addLog(data, `Zestaw ${s.id} został podkablowany Jakubowi za 1 pkt.`);
      }
    }

    if (data.playerOrder && data.playerOrder.length > 0) {
      let nextIdx = (data.currentPlayerIndex + 1) % data.playerOrder.length;
      let safety = 0;
      while (data.passedPlayers && data.passedPlayers.includes(data.playerOrder[nextIdx]) && safety < 10) {
        nextIdx = (nextIdx + 1) % data.playerOrder.length;
        safety++;
      }
      data.currentPlayerIndex = nextIdx;
    }
    if (data.passedPlayers && data.passedPlayers.length === data.players.length) {
      data.phase = 'jakub_phase';
      addLog(data, `--- Start Fazy Jakuba ---`);
    }

    data.turnActionExecuted = false;
    return data;
  }

  /**
   * Move a pawn instance from region `fromIndex` to `toIndex`.
   */
  static handleMovePawn(data, { playerId, typeId, fromIndex, toIndex, pawnInstanceIndex = 0 }) {
    if (fromIndex !== null && fromIndex !== undefined) {
      const fromRegion = data.regions[fromIndex];
      const toRegion = data.regions[toIndex];
      if (!fromRegion || !toRegion) throw new Error('Invalid source or target region');

      if (!fromRegion.pawns[typeId] || !fromRegion.pawns[typeId][pawnInstanceIndex]) {
        throw new Error('Pawn instance not found in region');
      }

      if (typeId === 'jakub') {
        if (!data.jakubPath) data.jakubPath = [];
        data.jakubPath.push({
          from: fromIndex,
          to: toIndex,
          round: data.currentRound,
          phase: data.phase
        });
      }

      const [movedPawn] = fromRegion.pawns[typeId].splice(pawnInstanceIndex, 1);
      if (fromRegion.pawns[typeId].length === 0) delete fromRegion.pawns[typeId];

      if (typeId === 'jakub' && playerId) {
        movedPawn.range = Math.max(0, (movedPawn.range || 1) - 1);
      }

      if (!toRegion.pawns[typeId]) toRegion.pawns[typeId] = [];
      toRegion.pawns[typeId].push(movedPawn);

      addLog(data, `Ruch: ${typeId} przeniesiony z [${fromRegion.x},${fromRegion.y}] do [${toRegion.x},${toRegion.y}]`);
    } else {
      // Placing from bag / panel
      const toRegion = data.regions[toIndex];
      if (!toRegion) throw new Error('Invalid target region');

      const pawnConfig = DEFAULT_PAWN_CONFIGS[typeId] || { defaultStatuses: ['ENABLED'] };
      const newPawn = { 
        statuses: [...(pawnConfig.defaultStatuses || ['ENABLED'])], 
        ...(pawnConfig.defaultParameters ? JSON.parse(JSON.stringify(pawnConfig.defaultParameters)) : {}) 
      };

      if (!toRegion.pawns[typeId]) toRegion.pawns[typeId] = [];
      toRegion.pawns[typeId].push(newPawn);

      addLog(data, `Dodano ${typeId} w sektorze [${toRegion.x},${toRegion.y}]`);
    }

    return data;
  }

  /**
   * Pass turn in player phase. Excess hand (> MAX_SETS_KEPT_ON_PASS) is tipped to Jakub with no points.
   */
  static handlePassTurn(data, { playerId }) {
    if (!data.passedPlayers) data.passedPlayers = [];
    if (!data.passedPlayers.includes(playerId)) {
      data.passedPlayers.push(playerId);
    }

    const currentHand = (data.sets?.heldSets || []).filter((s) => String(s.ownerId) === String(playerId));
    const toDiscard = SharedPlacementManager.selectExcessSetsOnPass(currentHand);
    if (toDiscard.length > 0) {
      let jakub = null;
      for (const r of data.regions || []) {
        if (r.pawns?.jakub?.length > 0) {
          jakub = r.pawns.jakub[0];
          break;
        }
      }
      toDiscard.forEach((s) => {
        s.ownerId = 'jakub';
        if (jakub) {
          const result = applySetToJakubAnger(jakub, s.content);
          jakub.anger = result.anger;
          jakub.range = result.range;
        }
      });
      addLog(data, `Gracz ${playerId} spasował i oddał ${toDiscard.length} nadmiarowych zestawów Jakubowi (bez punktów). Furia Jakuba zaktualizowana.`);
    } else {
      addLog(data, `Gracz ${playerId} spasował turę.`);
    }

    // Advance player turn index
    if (data.playerOrder && data.playerOrder.length > 0) {
      data.currentPlayerIndex = (data.currentPlayerIndex + 1) % data.playerOrder.length;
    }

    return data;
  }

  /**
   * Deal sets to players and Jakub, then enter general phase.
   * Round 1: players already have initialSetsPerPlayer from game start — only Jakub draws.
   * Later rounds: each player receives SETUP_SETS_PER_PLAYER_PER_ROUND additional sets.
   */
  static handleDrawSets(data) {
    if (data.phase && data.phase !== 'setup') {
      throw new Error('Draw sets is only allowed during setup');
    }
    if (!data.sets) data.sets = { drawPile: [], discardPile: [], heldSets: [] };
    if (!data.sets.drawPile) data.sets.drawPile = [];
    if (!data.sets.discardPile) data.sets.discardPile = [];
    if (!data.sets.heldSets) data.sets.heldSets = [];

    const refillSets = (state) => {
      if (state.sets.drawPile.length === 0 && state.sets.discardPile.length > 0) {
        state.sets.drawPile = [...state.sets.discardPile];
        state.sets.discardPile = [];
        addLog(state, 'Przetasowywanie stosu odrzuconego do talii dobierania.');
      }
    };
    const draw = (state) => {
      refillSets(state);
      if (state.sets.drawPile.length === 0) return null;
      const randomIdx = Math.floor(Math.random() * state.sets.drawPile.length);
      return state.sets.drawPile.splice(randomIdx, 1)[0];
    };

    const round = data.currentRound || 1;
    let distributionCount = 0;
    if (round > 1) {
      (data.players || []).forEach((player) => {
        for (let i = 0; i < SETUP_SETS_PER_PLAYER_PER_ROUND; i++) {
          const set = draw(data);
          if (!set) break;
          set.ownerId = player.id;
          data.sets.heldSets.push(set);
          distributionCount++;
        }
      });
      if (distributionCount > 0) {
        addLog(data, `Runda ${round}: Każdy gracz dobrał ${SETUP_SETS_PER_PLAYER_PER_ROUND} nowych zestawów.`);
      }
    }

    let jakub = null;
    for (const r of data.regions || []) {
      if (r.pawns?.jakub?.length > 0) {
        jakub = r.pawns.jakub[0];
        break;
      }
    }

    const existingJakubSets = data.sets.heldSets.filter((s) => s.ownerId === 'jakub');
    existingJakubSets.forEach((s) => {
      s.ownerId = null;
      s.used = false;
      data.sets.discardPile.push(s);
    });
    data.sets.heldSets = data.sets.heldSets.filter((s) => s.ownerId !== 'jakub');

    for (let i = 0; i < JAKUB_SETS_PER_ROUND; i++) {
      const set = draw(data);
      if (!set) break;
      set.ownerId = 'jakub';
      data.sets.heldSets.push(set);
      if (jakub) {
        const result = applySetToJakubAnger(jakub, set.content);
        jakub.anger = result.anger;
        jakub.range = result.range;
        addLog(data, `Jakub przejął Zestaw ${set.id}. Furia/Zasięg zaktualizowane natychmiast.`);
      } else {
        addLog(data, `Jakub przejął Zestaw ${set.id} z puli.`);
      }
    }

    data.phase = 'general_phase';
    data.currentPlayerIndex = 0;
    data.passedPlayers = [];
    data.turnActionExecuted = false;
    addLog(data, '--- Start Fazy Generałów ---');
    return data;
  }
}
