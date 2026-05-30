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
  GHOST_FINAL_SCORING_MAX_OTHER_BONUS,
  SERVER_URL
} from '../constants/constants';
import { PAWN_TYPES } from '../constants/pawnTypes';
import { RACES } from '../constants/game';
import { Board } from '../constants/board';
import { PlacementManager } from '../logic/placementManager';
import { applySetToJakubAnger, executeJakubStep } from '../strategies/jakubStrategy';
import { GeneralSelectionManager } from '../../shared/generalSelectionManager.js';
import { VampireScoring } from '../../shared/scoring/vampireScoring.js';
import { WerewolfScoring } from '../../shared/scoring/werewolfScoring.js';
import { GhostScoring } from '../../shared/scoring/ghostScoring.js';
import { BardakScoring } from '../../shared/scoring/bardakScoring.js';

export const useAutoplay = ({ 
  gameId, 
  gameState, 
  updateGameWithSync, 
  addLog,
  manualPlayers,
  playerId
}) => {
  const [isFullAutoplay, setIsFullAutoplay] = useState(false);
  const [isJakubAutoplay, setIsJakubAutoplay] = useState(false);
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
    let idx = (state.sets.drawPile || []).findIndex(s => s.id == setId);
    if (idx !== -1) return state.sets.drawPile.splice(idx, 1)[0];
    idx = (state.sets.heldSets || []).findIndex(s => s.id == setId);
    if (idx !== -1) return state.sets.heldSets.splice(idx, 1)[0];
    idx = (state.sets.discardPile || []).findIndex(s => s.id == setId);
    if (idx !== -1) return state.sets.discardPile.splice(idx, 1)[0];
    return null;
  }, []);

  const handleAutoplayTick = useCallback(async () => {
    if (!isFullAutoplay && !isJakubAutoplay) return;
    if (!gameId || gameState.gameStatus === 'finished') return;

    // If only Jakub automation is active, we only automate jakub_phase 
    // OR the transition to it if everyone has passed.
    if (isJakubAutoplay && !isFullAutoplay && gameState.phase !== 'jakub_phase') {
      const allPassed = gameState.players && gameState.passedPlayers && 
                        gameState.passedPlayers.length === gameState.players.length;
      if (!allPassed) return;
    }

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
      
      let jakub = null;
      for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }

      for (let i = 0; i < JAKUB_INITIAL_SETS; i++) {
        const set = drawSet(workState);
        if (set) {
          set.ownerId = 'jakub';
          if (!workState.sets.heldSets) workState.sets.heldSets = [];
          workState.sets.heldSets.push(set);
          
          if (jakub) {
            const result = applySetToJakubAnger(jakub, set.content);
            jakub.anger = result.anger;
            jakub.range = result.range;
            addLog(workState, `Jakub claimed Set ${set.id}. Anger updated immediately.`);
          } else {
            addLog(workState, `Jakub claimed Set ${set.id} from pool.`);
          }
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
      
      // Pause autoplay and wait for manual player turn
      const isManual = (manualPlayers && manualPlayers.includes(curId)) || curId === playerId;
      if (isManual && !workState.passedPlayers.includes(curId)) {
        setIsFullAutoplay(false);
        return;
      }

      if (!curPlayer.generalOf) {
        const hand = (workState.sets.heldSets || []).filter(s => s.ownerId === curId);
        const pick = GeneralSelectionManager.chooseGeneral(
          workState.availableGenerals,
          hand,
          workState.regions,
          workState.sets.pawns
        );
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
      const globalPool = { ...workState.sets.pawns };
      const playLimits = workState.sets.pawnsInPlayLimit || globalPool;
      const best = PlacementManager.findBestPlacement(workState.regions, workState.sets.heldSets, curId, curPlayer.generalOf, globalPool, playLimits);

      if (best) {
        const { logSummaryString, statusLogString } = PlacementManager.executePlacement(best, workState, PAWN_TYPES, playLimits);
        addLog(workState, `Player ${curId} placed Set ${best.set.id} [${logSummaryString}] | Board: ${statusLogString}`);
      } else {
        const excess = PlacementManager.executePass(curPlayer, workState, MAX_HAND_SIZE, applySetToJakubAnger);
        if (excess > 0) {
          addLog(workState, `Player ${curId} passed and sold ${excess} excess set(s). Jakub Anger updated.`, { race: curPlayer.generalOf, points: excess });
        } else {
          addLog(workState, `Player ${curId} passed.`);
        }
      }
      if (workState.passedPlayers.length === workState.players.length) {
        workState.phase = 'jakub_phase'; addLog(workState, `--- Start of Jakub Phase ---`);
      } else workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
      updateGameWithSync(workState);
      return;
    }

    if (workState.phase === 'jakub_phase') {
      const step = executeJakubStep(workState);
      if (step.actionTaken) { 
        addLog(step.newState, step.log, step.metadata || {}); 
        if (step.metadata && step.metadata.ramboPointsAwarded) {
          step.metadata.ramboPointsAwarded.forEach(r => {
            addLog(step.newState, `🔥 Rambo Survivor: ${r.player} (${r.race.toUpperCase()}) gained ${r.points} bonus points.`, { race: r.race, points: r.points });
          });
        }
        updateGameWithSync(step.newState); 
      }
      else {
        addLog(workState, `Jakub stops his rampage.`);
        let jakub = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }
        if (jakub) { 
          jakub.range = 1; 
          addLog(workState, `Jakub range reset to 1.`); 
        }
        const toDiscard = (workState.sets.heldSets || []).filter(s => s.ownerId === 'jakub');
        toDiscard.forEach(s => { s.ownerId = null; s.used = false; if (!workState.sets.discardPile) workState.sets.discardPile = []; workState.sets.discardPile.push(s); });
        workState.sets.heldSets = (workState.sets.heldSets || []).filter(s => s.ownerId !== 'jakub');
        
        let jakR = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakR = r; break; } }
        if (jakR && jakR.pawns.jakub[0]) {
          jakR.pawns.jakub[0].movedThisRound = false;
        }

        Board.updateJakubDistance(workState.regions);

        if (workState.currentRound >= (workState.totalRounds || TOTAL_GAME_ROUNDS)) { 
          workState.phase = 'final_scoring'; 
          workState.currentPlayerIndex = 0; 
          addLog(workState, `--- FINAL SCORING PHASE (08:00) ---`); 
        }
        else { 
          workState.phase = 'event_phase'; 
          addLog(workState, `--- EVENT PHASE ---`); 
        }
        
        if (!isFullAutoplay) {
          setIsJakubAutoplay(false); // Stop if it was only Jakub mode
        }
        
        updateGameWithSync(workState);
      }
      return;
    }

    if (workState.phase === 'event_phase') {
      if (isFullAutoplay) {
        // Automatically call the server to execute the event phase
        try {
          const res = await fetch(`${SERVER_URL}/api/map/${gameId}/event-phase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.state) {
            // State is already updated on server and emitted via socket, 
            // but we update locally too for smoothness if needed.
            // Actually, socket will handle it.
          }
        } catch (err) {
          console.error('Autoplay event phase failed:', err);
        }
      }
      return;
    }

    if (workState.phase === 'final_scoring') {
      workState.players.forEach(curPlayer => {
        const pick = curPlayer.generalOf;
        if (!pick) return;
        let addedPoints = 0;
        
        if (pick === 'vampire') addedPoints = VampireScoring.calculateFinal(workState.regions);
        else if (pick === 'werewolf') addedPoints = WerewolfScoring.calculateFinal(workState.regions);
        else if (pick === 'ghost') addedPoints = GhostScoring.calculateFinal(workState.regions);
        else if (pick === 'bardak') addedPoints = BardakScoring.calculateFinal(workState.regions);
        
        curPlayer.points += addedPoints; 
        addLog(workState, `Final Scoring: Player ${curPlayer.id} (+${addedPoints} for ${pick}s)`);
      });

      workState.phase = 'End Game';
      workState.gameStatus = 'finished';
      
      const maxPoints = Math.max(...workState.players.map(p => p.points));
      const winners = workState.players.filter(p => p.points === maxPoints);
      
      if (winners.length > 1) {
        addLog(workState, `GAME OVER! It's a TIE between Players: ${winners.map(w => w.id).join(', ')} with ${maxPoints} points!`);
      } else {
        addLog(workState, `GAME OVER! Winner: Player ${winners[0].id} with ${maxPoints} points.`);
      }

      setIsFullAutoplay(false);
      setIsJakubAutoplay(false);
      updateGameWithSync(workState);
      return;
    }
  }, [isFullAutoplay, isJakubAutoplay, gameId, gameState, updateGameWithSync, addLog, drawSet, manualPlayers, playerId]);

  useEffect(() => {
    const timer = setInterval(() => { 
      if (isFullAutoplay || isJakubAutoplay) handleAutoplayTick(); 
    }, autoplaySpeed);
    return () => clearInterval(timer);
  }, [isFullAutoplay, isJakubAutoplay, autoplaySpeed, handleAutoplayTick]);

  return {
    isFullAutoplay,
    setIsFullAutoplay,
    isJakubAutoplay,
    setIsJakubAutoplay,
    autoplaySpeed,
    setAutoplaySpeed,
    findAndRemoveSetById
  };
};
