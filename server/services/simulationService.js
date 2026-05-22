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
  getBestTargetRegion 
} from '../boardManager.js';
import { Scoring } from '../scoring.js';
import { PlacementManager } from './placementManager.js';
import { 
  loadSetFile, 
  generateSetData 
} from '../setManager.js';
import { 
  CONFIGS_DIR,
  getGlobalConfig,
  getGameConfig
} from '../gameLogic.js';
import { GameEventPhaseManager } from '../gameEventPhaseManager.js';

export function runDetailedSimulation(set, uploadedSets) {
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
    let availableGenerals = [...RACES].sort(() => Math.random() - 0.5);
    playerOrder.forEach(id => { const p = players.find(x => x.id === id); p.generalOf = availableGenerals.pop(); roundData.generals[p.name] = p.generalOf; });
    let passed = new Set();
    while (passed.size < players.length) {
      for (const id of playerOrder) {
        if (passed.has(id)) continue;
        const p = players.find(x => x.id === id);
        const pool = { ...setsData.pawns };
        const playLimits = setsData.pawnsInPlayLimit || pool;
        const best = PlacementManager.findBestPlacement(regions, setsData.heldSets, p.id, p.generalOf, pool, playLimits);
        if (best && best.pts > 1) {
          const pointGains = PlacementManager.executePlacement(best, regions, players, setsData.heldSets, setsData.discardPile);
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
          const excess = PlacementManager.executePass(p, setsData.heldSets, 3);
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
      continues = false; let curR = regions.find(r => r.pawns.jakub?.length > 0); const sortedAngerRaces = RACES.map(r => ({ race: r, val: jakub.anger[r] })).filter(a => a.val > 0).sort((a,b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race)).map(a => a.race);
      if (sortedAngerRaces.length === 0) break;
      let actionFound = false;
      for (const race of sortedAngerRaces) {
        const units = curR.pawns[race]?.length || 0;
        if (units > 0) { 
          const killCount = Math.min(units, jakub.anger[race]); 
          const p = players.find(x => x.generalOf === race); 
          if (p) p.points = Math.max(0, p.points - killCount); 
          jakub.anger[race] = Math.max(0, jakub.anger[race] - killCount); 
          curR.pawns[race].splice(0, killCount); 
          if (curR.pawns[race].length === 0) delete curR.pawns[race]; 
          continues = true; 
          actionFound = true; 
          roundData.turns.push({ type: 'jakub_attack', regionId: curR.id, race, killCount }); 
          break; 
        }
      }
      if (actionFound) continue;
      const candidates = getRegionsInRange(regions, curR.id, jakub.range); const bestRIdx = getBestTargetRegion(candidates, sortedAngerRaces, regions);
      if (bestRIdx !== null) { const fromId = curR.id; regions[bestRIdx].pawns.jakub = curR.pawns.jakub; delete curR.pawns.jakub; jakub.range = Math.max(0, jakub.range - 1); continues = true; roundData.turns.push({ type: 'jakub_move', from: fromId, to: regions[bestRIdx].id, remainingRange: jakub.range }); }
    }
    let jakR_after = regions.find(r => r.pawns.jakub?.length > 0);
    if (jakR_after) { RACES.forEach(race => { const count = jakR_after.pawns[race]?.length || 0; if (count > 0) { const pts = count * 2; const p = players.find(x => x.generalOf === race); if (p) { p.points += pts; roundData.turns.push({ type: 'rambo_points', player: p.name, race, points: pts }); } } }); }
    jakub.range = 1; jakubSets.forEach(s => { const idx = setsData.heldSets.findIndex(x => x.id === s.id); const recycled = setsData.heldSets.splice(idx, 1)[0]; recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled); });
    
    // --- EVENT PHASE ---
    if (round < gameConfig.totalRounds) {
      const eventManager = new GameEventPhaseManager({ regions, players, sets: setsData, history: [], currentRound: round, totalRounds: gameConfig.totalRounds, phase: 'event_phase' });
      eventManager.executePhase();
      // Transfer history from eventManager back to roundData if needed, or just keep it separate
      // For simulation, we can just add the event to turns or a new field
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
    if (pick === 'vampire') { let regionsWithVampires = 0; regions.forEach(r => { if (r.pawns[pick]?.length > 0) regionsWithVampires++; }); addedPoints = regionsWithVampires * 2; }
    else if (pick === 'werewolf') { let count = 0; regions.forEach(r => count += (r.pawns[pick]?.length || 0)); addedPoints = count; }
    else if (pick === 'ghost') { regions.forEach(r => { const myCount = r.pawns[pick]?.length || 0; if (myCount > 0) { let others = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0); if (others.reduce((a,b)=>a+b,0) === 0) addedPoints += 2; else if (myCount > Math.max(...others)) addedPoints += 1; } }); }
    else if (pick === 'bardak') { regions.forEach(r => { const myCount = r.pawns[pick]?.length || 0; if (myCount > 0) { let othersCounts = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0); const maxOther = Math.max(...othersCounts); if (myCount > maxOther) addedPoints += 1; } }); }
    p.points += addedPoints; finalScoringBreakdown[p.name] = { race: pick, bonus: addedPoints, finalTotal: p.points };
  });
  gameHistory.finalScoring = finalScoringBreakdown;
  gameHistory.winner = [...players].sort((a,b) => b.points - a.points)[0].name;
  return gameHistory;
}

export function runBasicSimulation(set, uploadedSets) {
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
    vampire: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
    werewolf: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
    ghost: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
    bardak: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 }
  };
  for (let round = 1; round <= gameConfig.totalRounds; round++) {
    players.forEach(p => { const myHeld = setsData.heldSets.filter(s => s.ownerId === p.id); const needed = gameConfig.setupSetsPerPlayerPerRound - myHeld.length; for (let i = 0; i < needed; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
    for (let i = 0; i < gameConfig.jakubSetsPerRound; i++) { const s = drawSet(); if (s) { s.ownerId = 'jakub'; setsData.heldSets.push(s); } }
    let availableGenerals = [...RACES].sort(() => Math.random() - 0.5);
    playerOrder.forEach(id => { const p = players.find(x => x.id === id); p.generalOf = availableGenerals.pop(); });
    let passed = new Set();
    while (passed.size < players.length) {
      for (const id of playerOrder) {
        if (passed.has(id)) continue;
        const p = players.find(x => x.id === id);
        const pool = { ...setsData.pawns };
        const playLimits = setsData.pawnsInPlayLimit || pool;
        const best = PlacementManager.findBestPlacement(regions, setsData.heldSets, p.id, p.generalOf, pool, playLimits);
        if (best && best.pts > 1) {
          PlacementManager.executePlacement(best, regions, players, setsData.heldSets, setsData.discardPile);
        } else {
          PlacementManager.executePass(p, setsData.heldSets, 3);
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
      continues = false; let curR = regions.find(r => r.pawns.jakub?.length > 0);
      const sortedAngerRaces = RACES.map(r => ({ race: r, val: jakub.anger[r] })).filter(a => a.val > 0).sort((a,b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race)).map(a => a.race);
      if (sortedAngerRaces.length === 0) break;
      let actionFound = false;
      for (const race of sortedAngerRaces) {
        const units = curR.pawns[race]?.length || 0;
        if (units > 0) { const killCount = Math.min(units, jakub.anger[race]); const p = players.find(x => x.generalOf === race); if (p) p.points = Math.max(0, p.points - killCount); analytics[race].killed += killCount; jakub.anger[race] -= killCount; curR.pawns[race].splice(0, killCount); if (curR.pawns[race].length === 0) delete curR.pawns[race]; continues = true; actionFound = true; break; }
      }
      if (actionFound) continue;
      const candidates = getRegionsInRange(regions, curR.id, jakub.range); const bestRIdx = getBestTargetRegion(candidates, sortedAngerRaces, regions);
      if (bestRIdx !== null) { 
        regions[bestRIdx].pawns.jakub = curR.pawns.jakub; 
        delete curR.pawns.jakub; 
        jakub.range = Math.max(0, jakub.range - 1); // Decrease range on move
        continues = true; 
      }
    }
    let jakR_after = regions.find(r => r.pawns.jakub?.length > 0);
    if (jakR_after) {
      RACES.forEach(race => {
        const count = jakR_after.pawns[race]?.length || 0;
        if (count > 0) { const pts = count * 2; const p = players.find(x => x.generalOf === race); if (p) { p.points += pts; analytics[race].ramboPoints += pts; } }
      });
    }
    jakub.range = 1; // Reset to 1 after Jakub's phase
    jakubSets.forEach(s => { const idx = setsData.heldSets.findIndex(x => x.id === s.id); const recycled = setsData.heldSets.splice(idx, 1)[0]; recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled); });

    // --- EVENT PHASE ---
    if (round < gameConfig.totalRounds) {
      const eventManager = new GameEventPhaseManager({ regions, players, sets: setsData, history: [], currentRound: round, totalRounds: gameConfig.totalRounds, phase: 'event_phase' });
      eventManager.executePhase();
    }

    if (round === 1) { players.forEach(p => { if (p.generalOf) analytics[p.generalOf].afterR1 = p.points; }); }
    if (round < gameConfig.totalRounds) { players.forEach(p => p.generalOf = null); playerOrder = [...players].sort((a,b) => a.points - b.points).map(p => p.id); }
  }
  players.forEach(p => {
    const pick = p.generalOf; if (!pick) return;
    let addedPoints = 0;
    if (pick === 'vampire') {
      let regionsWithVampires = 0;
      regions.forEach(r => { if (r.pawns[pick]?.length > 0) regionsWithVampires++; });
      addedPoints = regionsWithVampires * 2;
    }
    else if (pick === 'werewolf') { let count = 0; regions.forEach(r => count += (r.pawns[pick]?.length || 0)); addedPoints = count; }
    else if (pick === 'ghost') {
      regions.forEach(r => {
        const myCount = r.pawns[pick]?.length || 0;
        if (myCount > 0) {
          let others = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
          if (others.reduce((a,b)=>a+b,0) === 0) addedPoints += 2; else if (myCount > Math.max(...others)) addedPoints += 1;
        }
      });
    } else if (pick === 'bardak') {
      regions.forEach(r => {
        const myCount = r.pawns[pick]?.length || 0;
        if (myCount > 0) {
          let othersCounts = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
          const maxOther = Math.max(...othersCounts);
          if (myCount > maxOther) addedPoints += 1;
        }
      });
    }
    p.points += addedPoints; analytics[pick].finalBonus = addedPoints; analytics[pick].total = p.points;
  });
  return { analytics };
}

export function runFullSimulation(setsConfig, inputGameConfig) {
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
    vampire: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
    werewolf: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
    ghost: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
    bardak: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 }
  };

  for (let round = 1; round <= roundsToPlay; round++) {
    players.forEach(p => { 
      const myHeld = setsData.heldSets.filter(s => s.ownerId === p.id); 
      const needed = roundDraw - myHeld.length; 
      for (let i = 0; i < needed; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } 
    });
    for (let i = 0; i < jakubDraw; i++) { const s = drawSet(); if (s) { s.ownerId = 'jakub'; setsData.heldSets.push(s); } }
    
    let availableGenerals = [...RACES].sort(() => Math.random() - 0.5);
    playerOrder.forEach(id => { const p = players.find(x => x.id === id); p.generalOf = availableGenerals.pop(); });
    
    let passed = new Set();
    while (passed.size < players.length) {
      for (const id of playerOrder) {
        if (passed.has(id)) continue;
        const p = players.find(x => x.id === id);
        const pool = { ...setsData.pawns };
        const playLimits = setsData.pawnsInPlayLimit || pool;
        const best = PlacementManager.findBestPlacement(regions, setsData.heldSets, p.id, p.generalOf, pool, playLimits);
        if (best && best.pts > 1) {
          PlacementManager.executePlacement(best, regions, players, setsData.heldSets, setsData.discardPile);
        } else {
          PlacementManager.executePass(p, setsData.heldSets, 3);
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
      continues = false; let curR = regions.find(r => r.pawns.jakub?.length > 0);
      const sortedAngerRaces = RACES.map(r => ({ race: r, val: jakub.anger[r] })).filter(a => a.val > 0).sort((a,b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race)).map(a => a.race);
      if (sortedAngerRaces.length === 0) break;
      let actionFound = false;
      for (const race of sortedAngerRaces) {
        const units = curR.pawns[race]?.length || 0;
        if (units > 0) { const killCount = Math.min(units, jakub.anger[race]); const p = players.find(x => x.generalOf === race); if (p) p.points = Math.max(0, p.points - killCount); analytics[race].killed += killCount; jakub.anger[race] -= killCount; curR.pawns[race].splice(0, killCount); if (curR.pawns[race].length === 0) delete curR.pawns[race]; continues = true; actionFound = true; break; }
      }
      if (actionFound) continue;
      const candidates = getRegionsInRange(regions, curR.id, jakub.range); const bestRIdx = getBestTargetRegion(candidates, sortedAngerRaces, regions);
      if (bestRIdx !== null) { 
        regions[bestRIdx].pawns.jakub = curR.pawns.jakub; 
        delete curR.pawns.jakub; 
        jakub.range = Math.max(0, jakub.range - 1);
        continues = true; 
      }
    }
    let jakR_after = regions.find(r => r.pawns.jakub?.length > 0);
    if (jakR_after) {
      RACES.forEach(race => {
        const count = jakR_after.pawns[race]?.length || 0;
        if (count > 0) { const pts = count * 2; const p = players.find(x => x.generalOf === race); if (p) { p.points += pts; analytics[race].ramboPoints += pts; } }
      });
    }
    jakub.range = 1;
    jakubSets.forEach(s => { const idx = setsData.heldSets.findIndex(x => x.id === s.id); const recycled = setsData.heldSets.splice(idx, 1)[0]; recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled); });
    
    // --- EVENT PHASE ---
    if (round < roundsToPlay) {
      const eventManager = new GameEventPhaseManager({ regions, players, sets: setsData, history: [], currentRound: round, totalRounds: roundsToPlay, phase: 'event_phase' });
      eventManager.executePhase();
      const event = eventManager.gameData.events.drawn[eventManager.gameData.events.drawn.length - 1];
      if (event) {
        // Apply any rambo-related analytics changes if needed, but events mostly affect anger and limits
        // which are already applied to the objects in the simulation.
      }
    }

    if (round === 1) { players.forEach(p => { if (p.generalOf) analytics[p.generalOf].afterR1 = p.points; }); }
    if (round < roundsToPlay) { players.forEach(p => p.generalOf = null); playerOrder = [...players].sort((a,b) => a.points - b.points).map(p => p.id); }
  }

  players.forEach(p => {
    const pick = p.generalOf; if (!pick) return;
    let addedPoints = 0;
    if (pick === 'vampire') {
      let regionsWithVampires = 0;
      regions.forEach(r => { if (r.pawns[pick]?.length > 0) regionsWithVampires++; });
      addedPoints = regionsWithVampires * 2;
    }
    else if (pick === 'werewolf') { let count = 0; regions.forEach(r => count += (r.pawns[pick]?.length || 0)); addedPoints = count; }
    else if (pick === 'ghost') {
      regions.forEach(r => {
        const myCount = r.pawns[pick]?.length || 0;
        if (myCount > 0) {
          let others = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
          if (others.reduce((a,b)=>a+b,0) === 0) addedPoints += 2; else if (myCount > Math.max(...others)) addedPoints += 1;
        }
      });
    } else if (pick === 'bardak') {
      regions.forEach(r => {
        const myCount = r.pawns[pick]?.length || 0;
        if (myCount > 0) {
          let othersCounts = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
          const maxOther = Math.max(...othersCounts);
          if (myCount > maxOther) addedPoints += 1;
        }
      });
    }
    p.points += addedPoints; analytics[pick].finalBonus = addedPoints; analytics[pick].total = p.points;
  });

  return { analytics };
}
