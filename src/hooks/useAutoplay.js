import { useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_HAND_SIZE, 
  MAX_HAND_SIZE, 
  JAKUB_INITIAL_SETS, 
  SURVIVOR_BONUS_MULTIPLIER, 
  TOTAL_GAME_ROUNDS, 
  DEFAULT_AUTOPLAY_SPEED,
  VAMPIRE_FINAL_SCORING_MULTIPLIER,
  GHOST_FINAL_SCORING_BONUS,
  GHOST_FINAL_SCORING_MAX_OTHER_BONUS
} from '../constants/constants';
import { PAWN_TYPES } from '../constants/pawnTypes';
import { RACES, calculateSetPlacementPoints } from '../constants/game';
import { applySetToJakubAnger, executeJakubStep } from '../strategies/jakubStrategy';

export const useAutoplay = ({ 
  gameId, 
  gameState, 
  updateGameWithSync, 
  addLog, 
  jakubRegion 
}) => {
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(DEFAULT_AUTOPLAY_SPEED);

  const refillSetsIfNeeded = useCallback((state) => {
    if (!state.sets.drawPile) state.sets.drawPile = [];
    if (!state.sets.discardPile) state.sets.discardPile = [];
    if (state.sets.drawPile.length === 0 && state.sets.discardPile.length > 0) {
      state.sets.drawPile = [...state.sets.discardPile];
      state.sets.discardPile = [];
      addLog(state, "Reshuffling discard pile into draw pile.");
    }
  }, [addLog]);

  const drawSet = useCallback((state) => {
    refillSetsIfNeeded(state);
    if (state.sets.drawPile.length === 0) return null;
    const randomIdx = Math.floor(Math.random() * state.sets.drawPile.length);
    return state.sets.drawPile.splice(randomIdx, 1)[0];
  }, [refillSetsIfNeeded]);

  const findAndRemoveSetById = useCallback((state, setId) => {
    let idx = (state.sets.drawPile || []).findIndex(s => s.id === setId);
    if (idx !== -1) return state.sets.drawPile.splice(idx, 1)[0];
    idx = (state.sets.heldSets || []).findIndex(s => s.id === setId);
    if (idx !== -1) return state.sets.heldSets.splice(idx, 1)[0];
    idx = (state.sets.discardPile || []).findIndex(s => s.id === setId);
    if (idx !== -1) return state.sets.discardPile.splice(idx, 1)[0];
    return null;
  }, []);

  const handleAutoplayTick = useCallback(async () => {
    if (!isAutoplay || !gameId || gameState.gameStatus === 'finished') return;
    let workState = JSON.parse(JSON.stringify(gameState));
    
    if (workState.phase === 'setup') {
      let distributionCount = 0;
      workState.players.forEach(player => {
        const myHeld = (workState.sets.heldSets || []).filter(s => s.ownerId === player.id);
        const needed = INITIAL_HAND_SIZE - myHeld.length;
        for (let i = 0; i < needed; i++) {
          const set = drawSet(workState);
          if (set) {
            set.ownerId = player.id;
            if (!workState.sets.heldSets) workState.sets.heldSets = [];
            workState.sets.heldSets.push(set);
            distributionCount++;
          }
        }
      });
      if (distributionCount > 0) addLog(workState, `Round ${workState.currentRound}: Refilled player hands to ${INITIAL_HAND_SIZE} sets.`);
      for (let i = 0; i < JAKUB_INITIAL_SETS; i++) {
        const set = drawSet(workState);
        if (set) {
          set.ownerId = 'jakub';
          if (!workState.sets.heldSets) workState.sets.heldSets = [];
          workState.sets.heldSets.push(set);
          addLog(workState, `Jakub claimed Set ${set.id} from pool.`);
        }
      }
      workState.phase = 'player_phase';
      workState.currentPlayerIndex = 0;
      workState.passedPlayers = [];
      addLog(workState, `--- Start of Player Phase (Round ${workState.currentRound}) ---`);
      updateGameWithSync(workState);
      return;
    }

    if (workState.phase === 'player_phase') {
      const curId = workState.playerOrder[workState.currentPlayerIndex];
      const curPlayer = workState.players.find(p => p.id === curId);
      if (!curPlayer.generalOf) {
        const pick = workState.availableGenerals[0];
        curPlayer.generalOf = pick;
        workState.availableGenerals = workState.availableGenerals.filter(g => g !== pick);
        addLog(workState, `Player ${curId} chose General of ${pick}s`);
        workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
        updateGameWithSync(workState);
        return;
      }
      if (workState.passedPlayers.includes(curId)) {
        workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
        updateGameWithSync(workState);
        return;
      }
      const myHeld = (workState.sets.heldSets || []).filter(s => s.ownerId === curId);
      const emptyR = workState.regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0));
      const currentOnBoard = PAWN_TYPES.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
      workState.regions.forEach(r => Object.entries(r.pawns).forEach(([tId, insts]) => { if (currentOnBoard[tId] !== undefined) currentOnBoard[tId] += insts.length; }));
      const currentPool = { ...workState.sets.pawns };
      Object.keys(currentPool).forEach(r => currentPool[r] -= currentOnBoard[r]);
      
      let best = null;
      myHeld.forEach(set => {
        let isPlaceable = true;
        Object.entries(set.content).forEach(([tId, count]) => { if (currentPool[tId] < count) isPlaceable = false; });
        if (!isPlaceable) return;
        emptyR.forEach(region => {
          const pts = calculateSetPlacementPoints(curPlayer.generalOf, set.content, region, jakubRegion);
          if (!best || pts > best.pts) best = { set, region, pts };
        });
      });

      if (best && best.pts > 1) {
        const targetRegion = workState.regions[best.region.id];
        Object.entries(best.set.content).forEach(([tId, count]) => {
          if (!targetRegion.pawns[tId]) targetRegion.pawns[tId] = [];
          for (let i = 0; i < count; i++) {
            const pawnType = PAWN_TYPES.find(p => p.id === tId);
            targetRegion.pawns[tId].push({ statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) });
          }
        });

        let logSummary = [];
        workState.players.forEach(p => {
          if (p.generalOf) {
            const racePts = calculateSetPlacementPoints(p.generalOf, best.set.content, targetRegion, jakubRegion);
            if (racePts > 0) {
              p.points += racePts;
              logSummary.push(`${p.generalOf[0].toUpperCase()}:+${racePts}`);
            }
          }
        });

        const usedSet = findAndRemoveSetById(workState, best.set.id);
        if (usedSet) { usedSet.ownerId = null; usedSet.used = false; if (!workState.sets.discardPile) workState.sets.discardPile = []; workState.sets.discardPile.push(usedSet); }
        addLog(workState, `Player ${curId} placed Set ${best.set.id} [${logSummary.join(', ')}]`);
      } else {
        workState.passedPlayers.push(curId);
        const currentHand = (workState.sets.heldSets || []).filter(s => s.ownerId === curId);
        if (currentHand.length > MAX_HAND_SIZE) {
          const excessCount = currentHand.length - MAX_HAND_SIZE;
          const sorted = [...currentHand].sort((a, b) => (a.content[curPlayer.generalOf] || 0) - (b.content[curPlayer.generalOf] || 0));
          const toDiscard = sorted.slice(0, excessCount);
          toDiscard.forEach(s => {
            const idx = workState.sets.heldSets.findIndex(h => h.id === s.id);
            if (idx !== -1) workState.sets.heldSets[idx].ownerId = 'jakub';
          });
          curPlayer.points += excessCount;
          addLog(workState, `Player ${curId} passed and sold ${excessCount} excess set(s) for ${excessCount} pts.`, { race: curPlayer.generalOf, points: excessCount });
        } else { addLog(workState, `Player ${curId} passed.`); }
      }
      if (workState.passedPlayers.length === workState.players.length) {
        workState.phase = 'jakub_phase'; workState.jakubAngerIncreased = false; addLog(workState, `--- Start of Jakub Phase ---`);
      } else workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
      updateGameWithSync(workState);
      return;
    }

    if (workState.phase === 'jakub_phase') {
      if (!workState.jakubAngerIncreased) {
        let jakub = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }
        if (jakub) {
          const jakubSets = (workState.sets.heldSets || []).filter(s => s.ownerId === 'jakub');
          jakubSets.forEach(s => {
            const result = applySetToJakubAnger(jakub, s.content);
            jakub.anger = result.anger; jakub.range = result.range;
            addLog(workState, `Jakub absorbed Set ${s.id}. Anger updated | Range: ${jakub.range}`);
          });
          workState.jakubAngerIncreased = true; updateGameWithSync(workState); return;
        }
      }
      const step = executeJakubStep(workState);
      if (step.actionTaken) { addLog(step.newState, step.log, step.metadata || {}); updateGameWithSync(step.newState); }
      else {
        addLog(workState, `Jakub stops his rampage.`);
        let jakub = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }
        if (jakub) { jakub.range = 1; addLog(workState, `Jakub range reset to 1.`); }
        const toDiscard = (workState.sets.heldSets || []).filter(s => s.ownerId === 'jakub');
        toDiscard.forEach(s => { s.ownerId = null; s.used = false; if (!workState.sets.discardPile) workState.sets.discardPile = []; workState.sets.discardPile.push(s); });
        workState.sets.heldSets = (workState.sets.heldSets || []).filter(s => s.ownerId !== 'jakub');
        
        let jakR = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakR = r; break; } }
        if (jakR) {
          RACES.forEach(race => {
            const count = jakR.pawns[race]?.length || 0;
            if (count > 0) {
              const pts = count * SURVIVOR_BONUS_MULTIPLIER;
              const playerIdx = workState.players.findIndex(p => p.generalOf === race);
              if (playerIdx !== -1) {
                workState.players[playerIdx].points += pts;
                addLog(workState, `Rambo Survivor: ${race.toUpperCase()} gained ${pts} bonus points.`, { race, points: pts });
              }
            }
          });
        }

        if (workState.currentRound >= TOTAL_GAME_ROUNDS) { workState.phase = 'final_scoring'; workState.currentPlayerIndex = 0; addLog(workState, `--- FINAL SCORING PHASE (08:00) ---`); }
        else { 
          workState.players.forEach(p => p.generalOf = null); workState.availableGenerals = [...RACES];
          workState.playerOrder = [...workState.players].sort((a, b) => a.points - b.points).map(p => p.id);
          workState.currentRound += 1; workState.phase = 'setup'; 
          addLog(workState, `--- Round ${workState.currentRound} ---`); 
        }
        updateGameWithSync(workState);
      }
      return;
    }

    if (workState.phase === 'final_scoring') {
      const curIdx = workState.currentPlayerIndex;
      if (curIdx < workState.players.length) {
        const curPlayer = workState.players[curIdx];
        const pick = curPlayer.generalOf;
        if (!pick) { workState.currentPlayerIndex += 1; updateGameWithSync(workState); return; }
        let addedPoints = 0;
        // Scoring logic (Vampire, Werewolf, Ghost, Bardak)
        // ... omitted details for brevity in write_file if possible, but keeping logic consistent
        if (pick === 'vampire') { 
          let count = 0; 
          workState.regions.forEach(r => count += (r.pawns[pick]?.length || 0)); 
          addedPoints = count * VAMPIRE_FINAL_SCORING_MULTIPLIER; 
        }
        else if (pick === 'werewolf') { 
          let count = 0; 
          workState.regions.forEach(r => count += (r.pawns[pick]?.length || 0)); 
          addedPoints = count; 
        }
        else if (pick === 'ghost') {
          workState.regions.forEach(r => {
            const myCount = r.pawns[pick]?.length || 0;
            if (myCount > 0) {
              let othersCounts = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
              const othersTotal = othersCounts.reduce((a, b) => a + b, 0);
              if (othersTotal === 0) addedPoints += GHOST_FINAL_SCORING_BONUS; 
              else { 
                const maxOther = Math.max(...othersCounts); 
                if (myCount > maxOther) addedPoints += GHOST_FINAL_SCORING_MAX_OTHER_BONUS; 
              }
            }
          });
        }
 else if (pick === 'bardak') {
          workState.regions.forEach(r => {
            const myCount = r.pawns[pick]?.length || 0;
            if (myCount > 0) {
              let othersCounts = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
              const maxOther = Math.max(...othersCounts);
              if (myCount > maxOther) addedPoints += 1;
            }
          });
        }
        curPlayer.points += addedPoints; 
        addLog(workState, `Player ${curPlayer.id} gained ${addedPoints} points for ${pick}s.`, { race: pick, points: addedPoints });
        workState.currentPlayerIndex += 1; 
        updateGameWithSync(workState);
      } else {
        workState.gameStatus = 'finished';
        const winner = [...workState.players].sort((a,b)=>b.points-a.points)[0];
        addLog(workState, `GAME OVER! Winner: Player ${winner.id} with ${winner.points} points.`);
        setIsAutoplay(false); updateGameWithSync(workState);
      }
    }
  }, [isAutoplay, gameId, gameState, updateGameWithSync, jakubRegion, addLog, drawSet, findAndRemoveSetById]);

  useEffect(() => {
    const timer = setInterval(() => { if (isAutoplay) handleAutoplayTick(); }, autoplaySpeed);
    return () => clearInterval(timer);
  }, [isAutoplay, autoplaySpeed, handleAutoplayTick]);

  return {
    isAutoplay,
    setIsAutoplay,
    autoplaySpeed,
    setAutoplaySpeed,
    findAndRemoveSetById // Exporting this as it's needed in App.jsx for manual moves
  };
};
