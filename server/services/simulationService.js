import fs from 'fs';
import path from 'path';
import { 
  RACES, 
  DEFAULT_PLAYERS, 
  INITIAL_PAWN_POOL, 
  DEFAULT_POWER_CONFIG,
  JAKUB_ANGER_THRESHOLD,
  JAKUB_BASE_RANGE
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
  let playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
  const drawSet = () => { if (setsData.drawPile.length === 0) { if (setsData.discardPile.length === 0) return null; setsData.drawPile = [...setsData.discardPile]; setsData.discardPile = []; } return setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; };
  players.forEach(p => { for (let i = 0; i < gameConfig.initialSetsPerPlayer; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
  
  const gameHistory = { 
    setup: { 
      playerOrder: [...playerOrder], 
      initialSets: JSON.parse(JSON.stringify(setsData.heldSets)),
      pawnPool: setsData.pawns,
      pawnsInPlayLimit: setsData.pawnsInPlayLimit || setsData.pawns
    }, 
    rounds: [] 
  };

  for (let round = 1; round <= gameConfig.totalRounds; round++) {
    const roundData = { round, generals: {}, turns: [], endPoints: {} };
    players.forEach(p => { const myHeld = setsData.heldSets.filter(s => s.ownerId === p.id); const needed = gameConfig.setupSetsPerPlayerPerRound - myHeld.length; for (let i = 0; i < needed; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
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
    while (passed.size < players.length) {
      for (const id of playerOrder) {
        if (passed.has(id)) continue;
        const p = players.find(x => x.id === id);
        const pool = { ...setsData.pawns };
        const playLimits = setsData.pawnsInPlayLimit || pool;
        const best = ServerPlacementManager.findBestPlacement(regions, setsData.heldSets, p.id, p.generalOf, pool, playLimits);
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
          const excess = ServerPlacementManager.executePass(p, setsData.heldSets, 3);
          if (excess > 0) {
            roundData.turns.push({
              type: 'pass_to_jakub',
              player: p.name,
              race: p.generalOf,
              setsGiven: excess,
              pointGains: [{ player: p.name, race: p.generalOf, points: excess }]
            });
          }
          passed.add(id);
        }
      }
    }
    let jakR = regions.find(r => r.pawns.jakub?.length > 0); let jakub = jakR.pawns.jakub[0]; const jakubSets = setsData.heldSets.filter(s => s.ownerId === 'jakub');
    jakubSets.forEach(s => { Object.entries(s.content).forEach(([race, count]) => { if (jakub.anger[race] !== undefined) jakub.anger[race] += count; }); });
    let extraRange = 0; Object.values(jakub.anger).forEach(val => { if (val >= JAKUB_ANGER_THRESHOLD) extraRange += 1; }); jakub.range = Math.min(5, JAKUB_BASE_RANGE + extraRange);
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
          const p = players.find(x => x.generalOf === race);
          if (p) p.points = Math.max(0, p.points - units);
          
          jakub.anger[race] = Math.max(0, angerVal - units);
          delete curR.pawns[race];
          killedAny = true;
          roundData.turns.push({ type: 'jakub_attack', regionId: curR.id, race, killCount: units });
        }
      });

      if (killedAny) {
        continues = true;
        continue;
      }

      // 2. If no targets left to kill in the current region, proceed to move.
      const sortedAnger = RACES
        .map(race => ({ race, val: jakub.anger[race] || 0 }))
        .filter(a => a.val > 0)
        .sort((a, b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race));
      
      if (sortedAnger.length === 0) {
        // Award Punkty Świadka Jakuba to all pawns remaining in Jakub's region (since anger on all bands is 0)
        RACES.forEach(race => {
          const count = curR.pawns[race]?.length || 0;
          if (count > 0 && (jakub.anger[race] || 0) === 0) {
            const pts = count * 2;
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
      let extraRange = 0;
      RACES.forEach(race => { if ((jakub.anger[race] || 0) >= 10) extraRange += 1; });
      const calculatedRange = 1 + extraRange;
      
      const candidates = getRegionsInRange(regions, curR.id, calculatedRange);

      let targetRace = null;
      let validCandidates = [];

      // Search through races in sortedAnger order for first one with pawns in range
      for (let i = 0; i < sortedAnger.length; i++) {
        const race = sortedAnger[i].race;
        const filtered = candidates.filter(rIdx => (regions[rIdx].pawns[race]?.length || 0) > 0);
        if (filtered.length > 0) {
          targetRace = race;
          validCandidates = filtered;
          break;
        }
      }
      
      if (targetRace && validCandidates.length > 0) {
        let bestRIdx = validCandidates[0];
        let maxCount = -1;
        validCandidates.forEach(rIdx => {
          const count = regions[rIdx].pawns[targetRace]?.length || 0;
          if (count > maxCount) {
            maxCount = count;
            bestRIdx = rIdx;
          }
        });
        
        // Award Punkty Świadka Jakuba before moving from curR (only when anger is 0)
        RACES.forEach(race => {
          const count = curR.pawns[race]?.length || 0;
          if (count > 0 && (jakub.anger[race] || 0) === 0) {
            const pts = count * 2;
            const p = players.find(x => x.generalOf === race);
            if (p) {
              p.points += pts;
              roundData.turns.push({ type: 'swiadek_jakuba_points', player: p.name, race, points: pts });
            }
          }
        });

        const fromId = curR.id;
        regions[bestRIdx].pawns.jakub = curR.pawns.jakub;
        delete curR.pawns.jakub;
        jakub.range = calculatedRange;
        continues = true;
        roundData.turns.push({ 
          type: 'jakub_move', 
          from: fromId, 
          to: regions[bestRIdx].id, 
          remainingRange: calculatedRange, 
          targetRace, 
          targetAnger: jakub.anger[targetRace] || 0, 
          targetUnitsCount: maxCount 
        });
      }
    }
    updateJakubDistance(regions);
    jakub.range = 1; jakubSets.forEach(s => { const idx = setsData.heldSets.findIndex(x => x.id === s.id); const recycled = setsData.heldSets.splice(idx, 1)[0]; recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled); });
    
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
  let playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
  const drawSet = () => { 
    if (setsData.drawPile.length === 0) { 
      if (setsData.discardPile.length === 0) return null; 
      setsData.drawPile = [...setsData.discardPile]; setsData.discardPile = []; 
    } 
    return setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; 
  };
  players.forEach(p => { for (let i = 0; i < gameConfig.initialSetsPerPlayer; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
  const analytics = {
    vampire: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0 },
    werewolf: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0 },
    ghost: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0 },
    bardak: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0 }
  };
  for (let round = 1; round <= gameConfig.totalRounds; round++) {
    players.forEach(p => { const myHeld = setsData.heldSets.filter(s => s.ownerId === p.id); const needed = gameConfig.setupSetsPerPlayerPerRound - myHeld.length; for (let i = 0; i < needed; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
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
    while (passed.size < players.length) {
      for (const id of playerOrder) {
        if (passed.has(id)) continue;
        const p = players.find(x => x.id === id);
        const pool = { ...setsData.pawns };
        const playLimits = setsData.pawnsInPlayLimit || pool;
        const best = ServerPlacementManager.findBestPlacement(regions, setsData.heldSets, p.id, p.generalOf, pool, playLimits);
        if (best) {
          const pointGains = ServerPlacementManager.executePlacement(best, regions, players, setsData.heldSets, setsData.discardPile);
          pointGains.forEach(gain => {
            if (analytics[gain.race]) {
              analytics[gain.race].setPlacement += gain.points;
            }
          });
        } else {
          const excess = ServerPlacementManager.executePass(p, setsData.heldSets, 3);
          if (excess > 0 && p.generalOf && analytics[p.generalOf]) {
            analytics[p.generalOf].passing += excess;
          }
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
    let extraRange = 0;
    Object.values(jakub.anger).forEach(val => { if (val >= JAKUB_ANGER_THRESHOLD) extraRange += 1; });
    jakub.range = Math.min(5, JAKUB_BASE_RANGE + extraRange);

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
          const p = players.find(x => x.generalOf === race);
          if (p) p.points = Math.max(0, p.points - units);
          
          analytics[race].killed += units;
          jakub.anger[race] = Math.max(0, angerVal - units);
          delete curR.pawns[race];
          killedAny = true;
        }
      });

      if (killedAny) {
        continues = true;
        continue;
      }

      // 2. If no targets left to kill in the current region, proceed to move.
      const sortedAnger = RACES
        .map(race => ({ race, val: jakub.anger[race] || 0 }))
        .filter(a => a.val > 0)
        .sort((a, b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race));
      
      if (sortedAnger.length === 0) {
        // Award Punkty Świadka Jakuba to all pawns remaining in Jakub's region (since anger on all bands is 0)
        RACES.forEach(race => {
          const count = curR.pawns[race]?.length || 0;
          if (count > 0 && (jakub.anger[race] || 0) === 0) {
            const pts = count * 2;
            const p = players.find(x => x.generalOf === race);
            if (p) {
              p.points += pts;
              analytics[race].swiadekJakubaPoints += pts;
            }
          }
        });
        break;
      }

      // Calculate dynamic movement range
      let extraRange = 0;
      RACES.forEach(race => { if ((jakub.anger[race] || 0) >= 10) extraRange += 1; });
      const calculatedRange = 1 + extraRange;
      
      const candidates = getRegionsInRange(regions, curR.id, calculatedRange);

      let targetRace = null;
      let validCandidates = [];

      // Search through races in sortedAnger order for first one with pawns in range
      for (let i = 0; i < sortedAnger.length; i++) {
        const race = sortedAnger[i].race;
        const filtered = candidates.filter(rIdx => (regions[rIdx].pawns[race]?.length || 0) > 0);
        if (filtered.length > 0) {
          targetRace = race;
          validCandidates = filtered;
          break;
        }
      }
      
      if (targetRace && validCandidates.length > 0) {
        let bestRIdx = validCandidates[0];
        let maxCount = -1;
        validCandidates.forEach(rIdx => {
          const count = regions[rIdx].pawns[targetRace]?.length || 0;
          if (count > maxCount) {
            maxCount = count;
            bestRIdx = rIdx;
          }
        });
        
        // Award Punkty Świadka Jakuba before moving from curR (only when anger is 0)
        RACES.forEach(race => {
          const count = curR.pawns[race]?.length || 0;
          if (count > 0 && (jakub.anger[race] || 0) === 0) {
            const pts = count * 2;
            const p = players.find(x => x.generalOf === race);
            if (p) {
              p.points += pts;
              analytics[race].swiadekJakubaPoints += pts;
            }
          }
        });

        regions[bestRIdx].pawns.jakub = curR.pawns.jakub;
        delete curR.pawns.jakub;
        jakub.range = calculatedRange;
        continues = true;
      }
    }
    updateJakubDistance(regions);
    jakub.range = 1; // Reset to 1 after Jakub's phase
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
  
  let playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
  const drawSet = () => { 
    if (setsData.drawPile.length === 0) { 
      if (setsData.discardPile.length === 0) return null; 
      setsData.drawPile = [...setsData.discardPile]; setsData.discardPile = []; 
    } 
    return setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; 
  };

  players.forEach(p => { for (let i = 0; i < initialDraw; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });

  const analytics = {
    vampire: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0 },
    werewolf: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0 },
    ghost: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0 },
    bardak: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, swiadekJakubaPoints: 0, setPlacement: 0, fewestPointsChoice: 0, passing: 0 }
  };

  for (let round = 1; round <= roundsToPlay; round++) {
    players.forEach(p => { 
      const myHeld = setsData.heldSets.filter(s => s.ownerId === p.id); 
      const needed = roundDraw - myHeld.length; 
      for (let i = 0; i < needed; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } 
    });
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
    while (passed.size < players.length) {
      for (const id of playerOrder) {
        if (passed.has(id)) continue;
        const p = players.find(x => x.id === id);
        const pool = { ...setsData.pawns };
        const playLimits = setsData.pawnsInPlayLimit || pool;
        const best = ServerPlacementManager.findBestPlacement(regions, setsData.heldSets, p.id, p.generalOf, pool, playLimits);
        if (best) {
          const pointGains = ServerPlacementManager.executePlacement(best, regions, players, setsData.heldSets, setsData.discardPile);
          pointGains.forEach(gain => {
            if (analytics[gain.race]) {
              analytics[gain.race].setPlacement += gain.points;
            }
          });
        } else {
          const excess = ServerPlacementManager.executePass(p, setsData.heldSets, 3);
          if (excess > 0 && p.generalOf && analytics[p.generalOf]) {
            analytics[p.generalOf].passing += excess;
          }
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

    let extraRange = 0;
    Object.values(jakub.anger).forEach(val => { if (val >= JAKUB_ANGER_THRESHOLD) extraRange += 1; });
    jakub.range = Math.min(5, JAKUB_BASE_RANGE + extraRange);

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
          const p = players.find(x => x.generalOf === race);
          if (p) p.points = Math.max(0, p.points - units);
          
          analytics[race].killed += units;
          jakub.anger[race] = Math.max(0, angerVal - units);
          delete curR.pawns[race];
          killedAny = true;
        }
      });

      if (killedAny) {
        continues = true;
        continue;
      }

      // 2. If no targets left to kill in the current region, proceed to move.
      const sortedAnger = RACES
        .map(race => ({ race, val: jakub.anger[race] || 0 }))
        .filter(a => a.val > 0)
        .sort((a, b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race));
      
      if (sortedAnger.length === 0) {
        // Award Punkty Świadka Jakuba to all pawns remaining in Jakub's region (since anger on all bands is 0)
        RACES.forEach(race => {
          const count = curR.pawns[race]?.length || 0;
          if (count > 0 && (jakub.anger[race] || 0) === 0) {
            const pts = count * 2;
            const p = players.find(x => x.generalOf === race);
            if (p) {
              p.points += pts;
              analytics[race].swiadekJakubaPoints += pts;
            }
          }
        });
        break;
      }

      // Calculate dynamic movement range
      let extraRange = 0;
      RACES.forEach(race => { if ((jakub.anger[race] || 0) >= 10) extraRange += 1; });
      const calculatedRange = 1 + extraRange;
      
      const candidates = getRegionsInRange(regions, curR.id, calculatedRange);

      let targetRace = null;
      let validCandidates = [];

      // Search through races in sortedAnger order for first one with pawns in range
      for (let i = 0; i < sortedAnger.length; i++) {
        const race = sortedAnger[i].race;
        const filtered = candidates.filter(rIdx => (regions[rIdx].pawns[race]?.length || 0) > 0);
        if (filtered.length > 0) {
          targetRace = race;
          validCandidates = filtered;
          break;
        }
      }
      
      if (targetRace && validCandidates.length > 0) {
        let bestRIdx = validCandidates[0];
        let maxCount = -1;
        validCandidates.forEach(rIdx => {
          const count = regions[rIdx].pawns[targetRace]?.length || 0;
          if (count > maxCount) {
            maxCount = count;
            bestRIdx = rIdx;
          }
        });
        
        // Award Punkty Świadka Jakuba before moving from curR (only when anger is 0)
        RACES.forEach(race => {
          const count = curR.pawns[race]?.length || 0;
          if (count > 0 && (jakub.anger[race] || 0) === 0) {
            const pts = count * 2;
            const p = players.find(x => x.generalOf === race);
            if (p) {
              p.points += pts;
              analytics[race].swiadekJakubaPoints += pts;
            }
          }
        });

        regions[bestRIdx].pawns.jakub = curR.pawns.jakub;
        delete curR.pawns.jakub;
        jakub.range = calculatedRange;
        continues = true;
      }
    }
    updateJakubDistance(regions);
    jakub.range = 1;
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
                             (analytics[race].finalBonus || 0);
    }
  });

  const sortedScores = players.map(p => p.points).sort((a, b) => b - a);
  const scoreDiff = sortedScores[0] - sortedScores[sortedScores.length - 1];
  const scoreDiff1st2nd = sortedScores[0] - sortedScores[1];
  return { analytics, scoreDiff, scoreDiff1st2nd };
}
