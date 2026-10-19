import fs from 'fs';
import path from 'path';
import { 
  RACES, 
  DEFAULT_PLAYERS, 
  INITIAL_PAWN_POOL, 
  DEFAULT_POWER_CONFIG,
  JAKUB_BASE_RANGE,
  computeJakubRange,
  PLAYER_IDS
} from '../constants.js';
import { 
  createEmptyRegions, 
  getRegionsInRange, 
  updateJakubDistance
} from '../boardManager.js';
import { Scoring } from '../../shared/scoring/scoring.js';
import { VampireScoring } from '../../shared/scoring/vampireScoring.js';
import { WerewolfScoring } from '../../shared/scoring/werewolfScoring.js';
import { GhostScoring } from '../../shared/scoring/ghostScoring.js';
import { BardakScoring } from '../../shared/scoring/bardakScoring.js';
import { ServerPlacementManager } from './serverPlacementManager.js';
import { 
  loadSetFile, 
  generateSetData 
} from '../setManager.js';
import { 
  CONFIGS_DIR,
  getGlobalConfig,
  getGameConfig
} from '../gameLogic.js';
import { GameEventPhaseManager } from '../events/gameEventPhaseManager.js';
import { GeneralSelectionManager } from '../../shared/generalSelectionManager.js';
import { MilosierdzieManager } from '../../shared/milosierdzieManager.js';
import { buildAngerTiers, cascadeTieBreak } from '../../src/strategies/jakubStrategy.js';

/**
 * Handles magnetism in server simulation — pulls all pawns from tied regions to Jakub's region.
 */
const handleMagnetismServer = (regions, jakubRegion, tiedRegionIndices) => {
  tiedRegionIndices.forEach(rIdx => {
    const region = regions[rIdx];
    RACES.forEach(race => {
      const pawns = region.pawns[race];
      if (pawns && pawns.length > 0) {
        if (!jakubRegion.pawns[race]) jakubRegion.pawns[race] = [];
        jakubRegion.pawns[race].push(...pawns);
        delete region.pawns[race];
      }
    });
  });
};

export function runDetailedSimulation(set, uploadedSets, uploadedEvents) {
  let simulationEvents = uploadedEvents ? {
    drawn: [],
    pool: JSON.parse(JSON.stringify(uploadedEvents))
  } : null;
  const regions = createEmptyRegions();
  const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
  const globalConfig = getGlobalConfig();
  const gameConfig = getGameConfig();
  
  // Set starting points
  players.forEach(p => p.points = gameConfig.startPointsAmmount);
  
  let setsData = uploadedSets;
  if (!setsData) {
    let requestedSet = set; 
    if (!requestedSet && fs.existsSync(path.join(CONFIGS_DIR, 'set_default.json'))) requestedSet = 'set_default'; 
    if (!requestedSet) requestedSet = globalConfig.defaultSetName;
    setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, gameConfig.maxPower, { maxUnitsPerSet: gameConfig.maxUnitsPerSet });
  }

  if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
  if (!setsData.discardPile) setsData.discardPile = []; if (!setsData.heldSets) setsData.heldSets = [];
  let playerOrder = [...PLAYER_IDS].sort(() => Math.random() - 0.5);
  const drawSet = () => { if (setsData.drawPile.length === 0) { if (setsData.discardPile.length === 0) return null; setsData.drawPile = [...setsData.discardPile]; setsData.discardPile = []; } return setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; };
  players.forEach(p => { for (let i = 0; i < gameConfig.initialSetsPerPlayer; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
  
  const gameHistory = { 
    setup: { 
      playerOrder: [...playerOrder], 
      initialSets: JSON.parse(JSON.stringify(setsData.heldSets)),
      pawnPool: setsData.pawns,
      pawnsInPlayLimit: setsData.pawnsInPlayLimit || setsData.pawns
    }, 
    rounds: [],
    magnetismCount: 0
  };

  for (let round = 1; round <= gameConfig.totalRounds; round++) {
    const roundData = { round, generals: {}, turns: [], endPoints: {} };
    if (round > 1) {
      players.forEach(p => {
        for (let i = 0; i < gameConfig.setupSetsPerPlayerPerRound; i++) {
          const s = drawSet();
          if (s) { s.ownerId = p.id; setsData.heldSets.push(s); }
        }
      });
    }
    for (let i = 0; i < gameConfig.jakubSetsPerRound; i++) { const s = drawSet(); if (s) { s.ownerId = 'jakub'; setsData.heldSets.push(s); } }
    let availableGenerals = [...RACES];
    playerOrder.forEach(id => {
      const p = players.find(x => x.id === id);
      const hand = setsData.heldSets.filter(s => s.ownerId === p.id);
      const pick = GeneralSelectionManager.chooseGeneral(availableGenerals, hand, regions, setsData.pawns);
      p.generalOf = pick;
      availableGenerals = availableGenerals.filter(g => g !== pick);
      roundData.generals[p.name] = p.generalOf;
    });
    let passed = new Set();
    const placementOrder = [...players].sort((a, b) => b.points - a.points).map(p => p.id);
    while (passed.size < players.length) {
      for (const id of placementOrder) {
        if (passed.has(id)) continue;
        const p = players.find(x => x.id === id);
        const pool = { ...setsData.pawns };
        const playLimits = setsData.pawnsInPlayLimit || pool;
        const best = ServerPlacementManager.findBestPlacement(regions, setsData.heldSets, p.id, p.generalOf, pool, playLimits, round);
        if (best) {
          const pointGains = ServerPlacementManager.executePlacement(best, regions, players, setsData.heldSets, setsData.discardPile);
          const onBoardStatus = {};
          RACES.forEach(race => {
            const current = regions.reduce((sum, r) => sum + (r.pawns[race]?.length || 0), 0);
            onBoardStatus[race] = `${current}/${playLimits[race]}`;
          });

          roundData.turns.push({
            type: 'placement',
            player: p.name,
            race: p.generalOf,
            regionId: best.region.id,
            pointGains,
            content: best.set.content,
            boardStatus: onBoardStatus
          });
        } else {
          const excess = ServerPlacementManager.executePass(p, setsData.heldSets, regions);
          if (excess > 0) {
            roundData.turns.push({
              type: 'pass_to_jakub',
              player: p.name,
              race: p.generalOf,
              setsGiven: excess,
              pointGains: []
            });
          }
          passed.add(id);
        }
      }
    }
    let jakR = regions.find(r => r.pawns.jakub?.length > 0); let jakub = jakR.pawns.jakub[0]; const jakubSets = setsData.heldSets.filter(s => s.ownerId === 'jakub');
    jakubSets.forEach(s => { Object.entries(s.content).forEach(([race, count]) => { if (jakub.anger[race] !== undefined) jakub.anger[race] += count; }); });
    jakub.range = computeJakubRange(jakub.anger);
    let continues = true;
    while (continues) {
      continues = false;
      let curR = regions.find(r => r.pawns.jakub?.length > 0);
      if (!curR) break;

      // 1. Before move, kill everyone in his current region that he has anger towards.
      let killedAny = false;
      RACES.forEach(race => {
        const units = curR.pawns[race]?.length || 0;
        const angerVal = jakub.anger[race] || 0;
        if (units > 0 && angerVal > 0) {
          const toKill = Math.min(units, angerVal);
          const p = players.find(x => x.generalOf === race);
          if (p) p.points = Math.max(0, p.points - toKill);
          
          jakub.anger[race] -= toKill;
          curR.pawns[race] = curR.pawns[race].slice(toKill);
          if (curR.pawns[race].length === 0) {
            delete curR.pawns[race];
          }
          killedAny = true;
          roundData.turns.push({ type: 'jakub_attack', regionId: curR.id, race, killCount: toKill });
        }
      });

      if (killedAny) {
        continues = true;
        continue;
      }

      // 2. If no targets left to kill in the current region, proceed to move.
      const angerTiers = buildAngerTiers(jakub);
      
      if (angerTiers.length === 0) {
        RACES.forEach(race => {
          const count = curR.pawns[race]?.length || 0;
          if (count > 0 && (jakub.anger[race] || 0) === 0) {
            const pts = count * 1;
            const p = players.find(x => x.generalOf === race);
            if (p) {
              p.points += pts;
              roundData.turns.push({ type: 'swiadek_jakuba_points', player: p.name, race, points: pts });
            }
          }
        });
        break;
      }

      // Calculate dynamic movement range
      const calculatedRange = computeJakubRange(jakub.anger);
      
      const candidates = getRegionsInRange(regions, curR.id, calculatedRange);
      const flatRaceOrder = angerTiers.flatMap(tier => tier.races);
      let validCandidates = candidates.filter(rIdx => 
        flatRaceOrder.some(race => (regions[rIdx].pawns[race]?.length || 0) > 0)
      );
      
      if (validCandidates.length > 0) {
        const cascadeResult = cascadeTieBreak(regions, validCandidates, angerTiers);
        
        // Award Punkty Świadka Jakuba before moving
        RACES.forEach(race => {
          const count = curR.pawns[race]?.length || 0;
          if (count > 0 && (jakub.anger[race] || 0) === 0) {
            const pts = count * 1;
            const p = players.find(x => x.generalOf === race);
            if (p) {
              p.points += pts;
              roundData.turns.push({ type: 'swiadek_jakuba_points', player: p.name, race, points: pts });
            }
          }
        });

        if (cascadeResult.magnetism) {
          // Niepochamowany Zwierzęcy Magnetyzm!
          handleMagnetismServer(regions, curR, cascadeResult.tiedRegions);
          roundData.turns.push({ type: 'magnetism', regionId: curR.id, tiedRegions: cascadeResult.tiedRegions.map(rIdx => regions[rIdx].id) });
          gameHistory.magnetismCount += 1;
          continues = true;
        } else {
          const targetRace = flatRaceOrder.find(race => (regions[cascadeResult.winner].pawns[race]?.length || 0) > 0) || flatRaceOrder[0];
          const fromId = curR.id;
          regions[cascadeResult.winner].pawns.jakub = curR.pawns.jakub;
          delete curR.pawns.jakub;
          jakub.range = calculatedRange;
          continues = true;
          roundData.turns.push({ 
            type: 'jakub_move', 
            from: fromId, 
            to: regions[cascadeResult.winner].id, 
            remainingRange: calculatedRange, 
            targetRace, 
            targetAnger: jakub.anger[targetRace] || 0, 
            targetUnitsCount: regions[cascadeResult.winner].pawns[targetRace]?.length || 0 
          });
        }
      }
    }
    updateJakubDistance(regions);
    jakub.range = JAKUB_BASE_RANGE; jakubSets.forEach(s => { const idx = setsData.heldSets.findIndex(x => x.id === s.id); const recycled = setsData.heldSets.splice(idx, 1)[0]; recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled); });
    
    // --- EVENT PHASE ---
    if (round < gameConfig.totalRounds) {
      const eventManager = new GameEventPhaseManager({ 
        regions, 
        players, 
        sets: setsData, 
        history: [], 
        currentRound: round, 
        totalRounds: gameConfig.totalRounds, 
        phase: 'event_phase',
        events: simulationEvents
      });
      eventManager.executePhase();
      if (!simulationEvents) {
        simulationEvents = eventManager.gameData.events;
      }
      const event = eventManager.gameData.events.drawn[eventManager.gameData.events.drawn.length - 1];
      roundData.event = event;
      roundData.turns.push({ type: 'event_drawn', eventId: event.id, title: event.title });
    }

    players.forEach(p => roundData.endPoints[p.name] = p.points); gameHistory.rounds.push(roundData);
    if (round < gameConfig.totalRounds) { players.forEach(p => p.generalOf = null); playerOrder = [...players].sort((a,b) => a.points - b.points).map(p => p.id); }
  }
  const finalScoringBreakdown = {};
  players.forEach(p => {
    const pick = p.generalOf; if (!pick) return; let addedPoints = 0;
    if (pick === 'vampire') addedPoints = VampireScoring.calculateFinal(regions);
    else if (pick === 'werewolf') addedPoints = WerewolfScoring.calculateFinal(regions);
    else if (pick === 'ghost') addedPoints = GhostScoring.calculateFinal(regions);
    else if (pick === 'bardak') addedPoints = BardakScoring.calculateFinal(regions);
    p.points += addedPoints; finalScoringBreakdown[p.name] = { race: pick, bonus: addedPoints, finalTotal: p.points };
  });
  gameHistory.finalScoring = finalScoringBreakdown;
  gameHistory.winner = [...players].sort((a,b) => b.points - a.points)[0].name;
  return gameHistory;
}

export function runBasicSimulation(set, uploadedSets, uploadedEvents) {
  let simulationEvents = uploadedEvents ? {
    drawn: [],
    pool: JSON.parse(JSON.stringify(uploadedEvents))
  } : null;
  const regions = createEmptyRegions();
  const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
  const globalConfig = getGlobalConfig();
  const gameConfig = getGameConfig();

  // Set starting points
  players.forEach(p => p.points = gameConfig.startPointsAmmount);
  
  let setsData = uploadedSets;
  if (!setsData) {
    let requestedSet = set; 
    if (!requestedSet && fs.existsSync(path.join(CONFIGS_DIR, 'set_default.json'))) requestedSet = 'set_default'; 
    if (!requestedSet) requestedSet = globalConfig.defaultSetName;
    setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, gameConfig.maxPower, { maxUnitsPerSet: gameConfig.maxUnitsPerSet });
  }

  if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
  if (!setsData.discardPile) setsData.discardPile = []; if (!setsData.heldSets) setsData.heldSets = [];
  let playerOrder = [...PLAYER_IDS].sort(() => Math.random() - 0.5);
  const drawSet = () => { 
    if (setsData.drawPile.length === 0) { 
      if (setsData.discardPile.length === 0) return null; 
      setsData.drawPile = [...setsData.discardPile]; setsData.discardPile = []; 
    } 
    return setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; 
  };
  players.forEach(p => { for (let i = 0; i < gameConfig.initialSetsPerPlayer; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
  const analytics = {
    vampire: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0, mercyPoints: 0 },
    werewolf: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0, mercyPoints: 0 },
    ghost: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0, mercyPoints: 0 },
    bardak: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0, mercyPoints: 0 }
  };
  analytics.magnetismCount = 0;
  for (let round = 1; round <= gameConfig.totalRounds; round++) {
    if (round > 1) {
      players.forEach(p => {
        for (let i = 0; i < gameConfig.setupSetsPerPlayerPerRound; i++) {
          const s = drawSet();
          if (s) { s.ownerId = p.id; setsData.heldSets.push(s); }
        }
      });
    }
    for (let i = 0; i < gameConfig.jakubSetsPerRound; i++) { const s = drawSet(); if (s) { s.ownerId = 'jakub'; setsData.heldSets.push(s); } }
    let availableGenerals = [...RACES];
    playerOrder.forEach((id, idx) => {
      const p = players.find(x => x.id === id);
      const hand = setsData.heldSets.filter(s => s.ownerId === p.id);
      const pick = GeneralSelectionManager.chooseGeneral(availableGenerals, hand, regions, setsData.pawns);
      p.generalOf = pick;
      availableGenerals = availableGenerals.filter(g => g !== pick);
      if (idx === 0 && pick && analytics[pick]) {
        analytics[pick].fewestPointsChoice += 1;
      }
    });
    let passed = new Set();
    const placementOrder = [...players].sort((a, b) => b.points - a.points).map(p => p.id);
    while (passed.size < players.length) {
      for (const id of placementOrder) {
        if (passed.has(id)) continue;
        const p = players.find(x => x.id === id);
        const pool = { ...setsData.pawns };
        const playLimits = setsData.pawnsInPlayLimit || pool;
        const best = ServerPlacementManager.findBestPlacement(regions, setsData.heldSets, p.id, p.generalOf, pool, playLimits, round);
        if (best) {
          const pointGains = ServerPlacementManager.executePlacement(best, regions, players, setsData.heldSets, setsData.discardPile);
          pointGains.forEach(gain => {
            if (analytics[gain.race]) {
              analytics[gain.race].setPlacement += gain.points;
            }
          });
        } else {
          ServerPlacementManager.executePass(p, setsData.heldSets, regions);
          passed.add(id);
        }
      }
    }
    let jakR = regions.find(r => r.pawns.jakub?.length > 0); let jakub = jakR.pawns.jakub[0];
    const jakubSets = setsData.heldSets.filter(s => s.ownerId === 'jakub');
    jakubSets.forEach(s => { 
      Object.entries(s.content).forEach(([race, count]) => { 
        if (jakub.anger[race] !== undefined) {
          jakub.anger[race] += count;
        }
      });
    });
    jakub.range = computeJakubRange(jakub.anger);

    let continues = true;
    while (continues) {
      continues = false;
      let curR = regions.find(r => r.pawns.jakub?.length > 0);
      if (!curR) break;

      // 1. Before move, kill everyone in his current region that he has anger towards.
      let killedAny = false;
      RACES.forEach(race => {
        const units = curR.pawns[race]?.length || 0;
        const angerVal = jakub.anger[race] || 0;
        if (units > 0 && angerVal > 0) {
          const toKill = Math.min(units, angerVal);
          const p = players.find(x => x.generalOf === race);
          if (p) p.points = Math.max(0, p.points - toKill);
          
          analytics[race].killed += toKill;
          jakub.anger[race] -= toKill;
          curR.pawns[race] = curR.pawns[race].slice(toKill);
          if (curR.pawns[race].length === 0) {
            delete curR.pawns[race];
          }
          killedAny = true;
        }
      });

      if (killedAny) {
        continues = true;
        continue;
      }

      // 2. If no targets left to kill in the current region, proceed to move.
      const angerTiers = buildAngerTiers(jakub);
      
      if (angerTiers.length === 0) {
        break;
      }

      // Calculate dynamic movement range
      const calculatedRange = computeJakubRange(jakub.anger);
      
      const candidates = getRegionsInRange(regions, curR.id, calculatedRange);
      const flatRaceOrder = angerTiers.flatMap(tier => tier.races);
      let validCandidates = candidates.filter(rIdx => 
        flatRaceOrder.some(race => (regions[rIdx].pawns[race]?.length || 0) > 0)
      );
      
      if (validCandidates.length > 0) {
        const cascadeResult = cascadeTieBreak(regions, validCandidates, angerTiers);
        
        if (cascadeResult.magnetism) {
          // Niepochamowany Zwierzęcy Magnetyzm!
          handleMagnetismServer(regions, curR, cascadeResult.tiedRegions);
          analytics.magnetismCount += 1;
          continues = true;
        } else {
          // Award Punkty Świadka Jakuba before moving (leaving curR)
          RACES.forEach(race => {
            const count = curR.pawns[race]?.length || 0;
            if (count > 0 && (jakub.anger[race] || 0) === 0) {
              const pts = count * 1;
              const p = players.find(x => x.generalOf === race);
              if (p) {
                p.points += pts;
                analytics[race].swiadekJakubaPoints += pts;
              }
            }
          });

          regions[cascadeResult.winner].pawns.jakub = curR.pawns.jakub;
          delete curR.pawns.jakub;
          jakub.range = calculatedRange;
          continues = true;
        }
      }
    }

    // Award Punkty Świadka Jakuba for the final region he stands in
    let finalR = regions.find(r => r.pawns.jakub?.length > 0);
    if (finalR) {
      RACES.forEach(race => {
        const count = finalR.pawns[race]?.length || 0;
        if (count > 0 && (jakub.anger[race] || 0) === 0) {
          const pts = count * 1;
          const p = players.find(x => x.generalOf === race);
          if (p) {
            p.points += pts;
            analytics[race].swiadekJakubaPoints += pts;
          }
        }
      });
    }

    updateJakubDistance(regions);
    
    // Faza Miłosierdzia Jakuba
    if (gameConfig.mercyActive !== false) {
      const mercyRewards = MilosierdzieManager.applyMercy(jakub, players);
      mercyRewards.forEach(reward => {
        if (analytics[reward.race]) {
          analytics[reward.race].mercyPoints = (analytics[reward.race].mercyPoints || 0) + reward.points;
        }
      });
    }

    jakub.range = JAKUB_BASE_RANGE; // Reset to 1 after Jakub's phase
    jakubSets.forEach(s => { const idx = setsData.heldSets.findIndex(x => x.id === s.id); const recycled = setsData.heldSets.splice(idx, 1)[0]; recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled); });

    // --- EVENT PHASE ---
    if (round < gameConfig.totalRounds) {
      const eventManager = new GameEventPhaseManager({ 
        regions, 
        players, 
        sets: setsData, 
        history: [], 
        currentRound: round, 
        totalRounds: gameConfig.totalRounds, 
        phase: 'event_phase',
        events: simulationEvents
      });
      eventManager.executePhase();
      if (!simulationEvents) {
        simulationEvents = eventManager.gameData.events;
      }
    }

    if (round === 1) { players.forEach(p => { if (p.generalOf) analytics[p.generalOf].afterR1 = p.points; }); }
    if (round < gameConfig.totalRounds) { players.forEach(p => p.generalOf = null); playerOrder = [...players].sort((a,b) => a.points - b.points).map(p => p.id); }
  }
  players.forEach(p => {
    const pick = p.generalOf; if (!pick) return;
    let addedPoints = 0;
    if (pick === 'vampire') addedPoints = VampireScoring.calculateFinal(regions);
    else if (pick === 'werewolf') addedPoints = WerewolfScoring.calculateFinal(regions);
    else if (pick === 'ghost') addedPoints = GhostScoring.calculateFinal(regions);
    else if (pick === 'bardak') addedPoints = BardakScoring.calculateFinal(regions);
    p.points += addedPoints; analytics[pick].finalBonus = addedPoints;
  });
  RACES.forEach(race => {
    if (analytics[race]) {
      analytics[race].total = (analytics[race].setPlacement || 0) + 
                             (analytics[race].passing || 0) + 
                             (analytics[race].swiadekJakubaPoints || 0) + 
                             (analytics[race].mercyPoints || 0) + 
                             (analytics[race].finalBonus || 0);
    }
  });
  const sortedScores = players.map(p => p.points).sort((a, b) => b - a);
  const scoreDiff = sortedScores[0] - sortedScores[sortedScores.length - 1];
  const scoreDiff1st2nd = sortedScores[0] - sortedScores[1];
  return { analytics, scoreDiff, scoreDiff1st2nd };
}

export function runFullSimulation(setsConfig, inputGameConfig, uploadedEvents) {
  let simulationEvents = uploadedEvents ? {
    drawn: [],
    pool: JSON.parse(JSON.stringify(uploadedEvents))
  } : null;
  const regions = createEmptyRegions();
  const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
  const defaultConfig = getGameConfig();
  const gameConfig = inputGameConfig ? { ...defaultConfig, ...inputGameConfig } : defaultConfig;
  
  const roundsToPlay = gameConfig.totalRounds;
  const initialDraw = gameConfig.initialSetsPerPlayer;
  const roundDraw = gameConfig.setupSetsPerPlayerPerRound;
  const jakubDraw = gameConfig.jakubSetsPerRound;
  const startPoints = gameConfig.startPointsAmmount;

  players.forEach(p => p.points = startPoints);

  let setsData = setsConfig;
  if (!setsData) {
    const globalConfig = getGlobalConfig();
    let requestedSet = null; 
    if (fs.existsSync(path.join(CONFIGS_DIR, 'set_default.json'))) requestedSet = 'set_default'; 
    if (!requestedSet) requestedSet = globalConfig.defaultSetName;
    setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, gameConfig.maxPower, { maxUnitsPerSet: gameConfig.maxUnitsPerSet });
  }

  if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
  if (!setsData.discardPile) setsData.discardPile = []; if (!setsData.heldSets) setsData.heldSets = [];
  
  let playerOrder = [...PLAYER_IDS].sort(() => Math.random() - 0.5);
  const drawSet = () => { 
    if (setsData.drawPile.length === 0) { 
      if (setsData.discardPile.length === 0) return null; 
      setsData.drawPile = [...setsData.discardPile]; setsData.discardPile = []; 
    } 
    return setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; 
  };

  players.forEach(p => { for (let i = 0; i < initialDraw; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });

  const analytics = {
    vampire: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0, mercyPoints: 0 },
    werewolf: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0, mercyPoints: 0 },
    ghost: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0, mercyPoints: 0 },
    bardak: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0, mercyPoints: 0 }
  };
  analytics.magnetismCount = 0;

  for (let round = 1; round <= roundsToPlay; round++) {
    if (round > 1) {
      players.forEach(p => {
        for (let i = 0; i < roundDraw; i++) {
          const s = drawSet();
          if (s) { s.ownerId = p.id; setsData.heldSets.push(s); }
        }
      });
    }
    for (let i = 0; i < jakubDraw; i++) { const s = drawSet(); if (s) { s.ownerId = 'jakub'; setsData.heldSets.push(s); } }
    
    let availableGenerals = [...RACES];
    playerOrder.forEach((id, idx) => {
      const p = players.find(x => x.id === id);
      const hand = setsData.heldSets.filter(s => s.ownerId === p.id);
      const pick = GeneralSelectionManager.chooseGeneral(availableGenerals, hand, regions, setsData.pawns);
      p.generalOf = pick;
      availableGenerals = availableGenerals.filter(g => g !== pick);
      if (idx === 0 && pick && analytics[pick]) {
        analytics[pick].fewestPointsChoice += 1;
      }
    });
    
    let passed = new Set();
    const placementOrder = [...players].sort((a, b) => b.points - a.points).map(p => p.id);
    while (passed.size < players.length) {
      for (const id of placementOrder) {
        if (passed.has(id)) continue;
        const p = players.find(x => x.id === id);
        const pool = { ...setsData.pawns };
        const playLimits = setsData.pawnsInPlayLimit || pool;
        const best = ServerPlacementManager.findBestPlacement(regions, setsData.heldSets, p.id, p.generalOf, pool, playLimits, round);
        if (best) {
          const pointGains = ServerPlacementManager.executePlacement(best, regions, players, setsData.heldSets, setsData.discardPile);
          pointGains.forEach(gain => {
            if (analytics[gain.race]) {
              analytics[gain.race].setPlacement += gain.points;
            }
          });
        } else {
          ServerPlacementManager.executePass(p, setsData.heldSets, regions);
          passed.add(id);
        }
      }
    }

    let jakR = regions.find(r => r.pawns.jakub?.length > 0); let jakub = jakR.pawns.jakub[0];
    const jakubSets = setsData.heldSets.filter(s => s.ownerId === 'jakub');
    jakubSets.forEach(s => { 
      Object.entries(s.content).forEach(([race, count]) => { 
        if (jakub.anger[race] !== undefined) {
          jakub.anger[race] += count;
        }
      });
    });

    jakub.range = computeJakubRange(jakub.anger);

    let continues = true;
    while (continues) {
      continues = false;
      let curR = regions.find(r => r.pawns.jakub?.length > 0);
      if (!curR) break;

      // 1. Before move, kill everyone in his current region that he has anger towards.
      let killedAny = false;
      RACES.forEach(race => {
        const units = curR.pawns[race]?.length || 0;
        const angerVal = jakub.anger[race] || 0;
        if (units > 0 && angerVal > 0) {
          const toKill = Math.min(units, angerVal);
          const p = players.find(x => x.generalOf === race);
          if (p) p.points = Math.max(0, p.points - toKill);
          
          analytics[race].killed += toKill;
          jakub.anger[race] -= toKill;
          curR.pawns[race] = curR.pawns[race].slice(toKill);
          if (curR.pawns[race].length === 0) {
            delete curR.pawns[race];
          }
          killedAny = true;
        }
      });

      if (killedAny) {
        continues = true;
        continue;
      }

      // 2. If no targets left to kill in the current region, proceed to move.
      const angerTiers = buildAngerTiers(jakub);
      
      if (angerTiers.length === 0) {
        break;
      }

      // Calculate dynamic movement range
      const calculatedRange = computeJakubRange(jakub.anger);
      
      const candidates = getRegionsInRange(regions, curR.id, calculatedRange);
      const flatRaceOrder = angerTiers.flatMap(tier => tier.races);
      let validCandidates = candidates.filter(rIdx => 
        flatRaceOrder.some(race => (regions[rIdx].pawns[race]?.length || 0) > 0)
      );
      
      if (validCandidates.length > 0) {
        const cascadeResult = cascadeTieBreak(regions, validCandidates, angerTiers);
        
        if (cascadeResult.magnetism) {
          // Niepochamowany Zwierzęcy Magnetyzm!
          handleMagnetismServer(regions, curR, cascadeResult.tiedRegions);
          analytics.magnetismCount += 1;
          continues = true;
        } else {
          // Award Punkty Świadka Jakuba before moving (leaving curR)
          RACES.forEach(race => {
            const count = curR.pawns[race]?.length || 0;
            if (count > 0 && (jakub.anger[race] || 0) === 0) {
              const pts = count * 1;
              const p = players.find(x => x.generalOf === race);
              if (p) {
                p.points += pts;
                analytics[race].swiadekJakubaPoints += pts;
              }
            }
          });

          regions[cascadeResult.winner].pawns.jakub = curR.pawns.jakub;
          delete curR.pawns.jakub;
          jakub.range = calculatedRange;
          continues = true;
        }
      }
    }

    // Award Punkty Świadka Jakuba for the final region he stands in
    let finalR = regions.find(r => r.pawns.jakub?.length > 0);
    if (finalR) {
      RACES.forEach(race => {
        const count = finalR.pawns[race]?.length || 0;
        if (count > 0 && (jakub.anger[race] || 0) === 0) {
          const pts = count * 1;
          const p = players.find(x => x.generalOf === race);
          if (p) {
            p.points += pts;
            analytics[race].swiadekJakubaPoints += pts;
          }
        }
      });
    }

    updateJakubDistance(regions);
    
    // Faza Miłosierdzia Jakuba
    if (gameConfig.mercyActive !== false) {
      const mercyRewards = MilosierdzieManager.applyMercy(jakub, players);
      mercyRewards.forEach(reward => {
        if (analytics[reward.race]) {
          analytics[reward.race].mercyPoints = (analytics[reward.race].mercyPoints || 0) + reward.points;
        }
      });
    }

    jakub.range = JAKUB_BASE_RANGE;
    jakubSets.forEach(s => { const idx = setsData.heldSets.findIndex(x => x.id === s.id); const recycled = setsData.heldSets.splice(idx, 1)[0]; recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled); });
    
    // --- EVENT PHASE ---
    if (round < roundsToPlay) {
      const eventManager = new GameEventPhaseManager({ 
        regions, 
        players, 
        sets: setsData, 
        history: [], 
        currentRound: round, 
        totalRounds: roundsToPlay, 
        phase: 'event_phase',
        events: simulationEvents
      });
      eventManager.executePhase();
      if (!simulationEvents) {
        simulationEvents = eventManager.gameData.events;
      }
      const event = eventManager.gameData.events.drawn[eventManager.gameData.events.drawn.length - 1];
      if (event) {
        // Apply any swiadek_jakuba-related analytics changes if needed, but events mostly affect anger and limits
        // which are already applied to the objects in the simulation.
      }
    }

    if (round === 1) { players.forEach(p => { if (p.generalOf) analytics[p.generalOf].afterR1 = p.points; }); }
    if (round < roundsToPlay) { players.forEach(p => p.generalOf = null); playerOrder = [...players].sort((a,b) => a.points - b.points).map(p => p.id); }
  }

  players.forEach(p => {
    const pick = p.generalOf; if (!pick) return;
    let addedPoints = 0;
    if (pick === 'vampire') addedPoints = VampireScoring.calculateFinal(regions);
    else if (pick === 'werewolf') addedPoints = WerewolfScoring.calculateFinal(regions);
    else if (pick === 'ghost') addedPoints = GhostScoring.calculateFinal(regions);
    else if (pick === 'bardak') addedPoints = BardakScoring.calculateFinal(regions);
    p.points += addedPoints; analytics[pick].finalBonus = addedPoints;
  });
  RACES.forEach(race => {
    if (analytics[race]) {
      analytics[race].total = (analytics[race].setPlacement || 0) + 
                             (analytics[race].passing || 0) + 
                             (analytics[race].swiadekJakubaPoints || 0) + 
                             (analytics[race].mercyPoints || 0) + 
                             (analytics[race].finalBonus || 0);
    }
  });

  const sortedScores = players.map(p => p.points).sort((a, b) => b - a);
  const scoreDiff = sortedScores[0] - sortedScores[sortedScores.length - 1];
  const scoreDiff1st2nd = sortedScores[0] - sortedScores[1];
  return { analytics, scoreDiff, scoreDiff1st2nd };
}
