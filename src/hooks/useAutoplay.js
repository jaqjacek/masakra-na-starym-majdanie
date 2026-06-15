import { useState, useEffect, useCallback, useRef } from 'react';
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
import { ClientPlacementManager } from '../logic/clientPlacementManager';
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
  const [autoplayEventPopup, setAutoplayEventPopup] = useState(null);
  const isProcessingRef = useRef(false);

  const refillSetsIfNeeded = useCallback((state) => {
    if (!state.sets.drawPile) state.sets.drawPile = [];
    if (!state.sets.discardPile) state.sets.discardPile = [];
    if (state.sets.drawPile.length === 0 && state.sets.discardPile.length > 0) {
      state.sets.drawPile = [...state.sets.discardPile];
      state.sets.discardPile = [];
      addLog(state, "Przetasowywanie stosu odrzuconego do talii dobierania.");
    }
  }, [addLog]);

  const drawSet = useCallback((state) => {
    refillSetsIfNeeded(state);
    if (state.sets.drawPile.length === 0) return null;
    const randomIdx = Math.floor(Math.random() * state.sets.drawPile.length);
    return state.sets.drawPile.splice(randomIdx, 1)[0];
  }, [refillSetsIfNeeded]);

  const findAndRemoveSetById = useCallback((state, setId, expectedOwnerId = undefined) => {
    console.log('[findAndRemoveSetById] START', { setId, expectedOwnerId });
    if (!state || !state.sets) {
      console.log('[findAndRemoveSetById] ERROR: state or state.sets missing');
      return null;
    }
    
    console.log('[findAndRemoveSetById] state.sets.heldSets:', (state.sets.heldSets || []).map(s => s ? { id: s.id, ownerId: s.ownerId } : null));

    if (expectedOwnerId !== undefined && expectedOwnerId !== null) {
      const idx = (state.sets.heldSets || []).findIndex(s => 
        s && String(s.id) === String(setId) && String(s.ownerId) === String(expectedOwnerId)
      );
      if (idx !== -1) {
        const found = state.sets.heldSets.splice(idx, 1)[0];
        console.log('[findAndRemoveSetById] FOUND and spliced from heldSets matching owner:', found);
        return found;
      }
    }
    
    let idx = (state.sets.heldSets || []).findIndex(s => s && String(s.id) === String(setId));
    if (idx !== -1) {
      const found = state.sets.heldSets.splice(idx, 1)[0];
      console.log('[findAndRemoveSetById] FOUND and spliced from heldSets by ID only:', found);
      return found;
    }
    idx = (state.sets.drawPile || []).findIndex(s => s && String(s.id) === String(setId));
    if (idx !== -1) {
      const found = state.sets.drawPile.splice(idx, 1)[0];
      console.log('[findAndRemoveSetById] FOUND and spliced from drawPile by ID only:', found);
      return found;
    }
    idx = (state.sets.discardPile || []).findIndex(s => s && String(s.id) === String(setId));
    if (idx !== -1) {
      const found = state.sets.discardPile.splice(idx, 1)[0];
      console.log('[findAndRemoveSetById] FOUND and spliced from discardPile by ID only:', found);
      return found;
    }
    console.log('[findAndRemoveSetById] NOT FOUND ANYWHERE');
    return null;
  }, []);

  const handleAutoplayTick = useCallback(async () => {
    if (autoplayEventPopup) {
      setAutoplayEventPopup(prev => {
        if (!prev) return null;
        if (prev.ticksLeft <= 1) {
          return null;
        }
        return { ...prev, ticksLeft: prev.ticksLeft - 1 };
      });
      return;
    }
    if (isProcessingRef.current) return;
    if (!isFullAutoplay && !isJakubAutoplay) return;
    if (!gameId || gameState.gameStatus === 'finished') return;
    if (gameState.turnActionExecuted) return; // Wait for manual player to click NEXT

    // If only Jakub automation is active, we only automate jakub_phase 
    // OR the transition to it if everyone has passed.
    if (isJakubAutoplay && !isFullAutoplay && gameState.phase !== 'jakub_phase') {
      const allPassed = gameState.players && gameState.passedPlayers && 
                        gameState.passedPlayers.length === gameState.players.length;
      if (!allPassed) return;
    }

    isProcessingRef.current = true;
    try {
      let workState = JSON.parse(JSON.stringify(gameState));
      
      if (workState.phase === 'setup') {
        let distributionCount = 0;
        workState.players.forEach(player => {
          const myHeld = (workState.sets.heldSets || []).filter(s => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(player.id));
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
        if (distributionCount > 0) addLog(workState, `Runda ${workState.currentRound}: Uzupełniono ręce graczy do ${INITIAL_HAND_SIZE} zestawów.`);
        
        let jakub = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }

        // Clear any existing sets belonging to Jakub before drawing new ones!
        const existingJakubSets = (workState.sets.heldSets || []).filter(s => s.ownerId === 'jakub');
        existingJakubSets.forEach(s => {
          s.ownerId = null;
          s.used = false;
          if (!workState.sets.discardPile) workState.sets.discardPile = [];
          workState.sets.discardPile.push(s);
        });
        workState.sets.heldSets = (workState.sets.heldSets || []).filter(s => s.ownerId !== 'jakub');

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
              addLog(workState, `Jakub przejął Zestaw ${set.id}. Furia zaktualizowana natychmiast.`);
            } else {
              addLog(workState, `Jakub przejął Zestaw ${set.id} z puli.`);
            }
          }
        }
        workState.phase = 'general_phase';
        workState.currentPlayerIndex = 0;
        workState.passedPlayers = [];
        workState.turnActionExecuted = false;
        addLog(workState, `--- Start Fazy Generałów ---`);
        await updateGameWithSync(workState);
        return;
      }

      if (workState.phase === 'general_phase') {
        const allChosen = workState.players.every(p => p.generalOf);
        if (allChosen) {
          workState.phase = 'player_phase';
          workState.currentPlayerIndex = 0;
          workState.passedPlayers = [];
          workState.turnActionExecuted = false;
          addLog(workState, `--- Start Fazy Graczy (Runda ${workState.currentRound}) ---`);
          await updateGameWithSync(workState);
          return;
        }

        const curId = workState.playerOrder[workState.currentPlayerIndex];
        const curPlayer = workState.players.find(p => p.id !== null && p.id !== undefined && String(p.id) === String(curId));

        if (curPlayer) {
          if (curPlayer.generalOf) {
            // Already has a general, just advance to the next player
            workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
            await updateGameWithSync(workState);
            return;
          }

          // Pause autoplay if this is a manual player's turn to choose a general
          const isManual = (manualPlayers && manualPlayers.some(id => String(id) === String(curId))) || (playerId !== null && playerId !== undefined && String(curId) === String(playerId));
          if (isManual) {
            setIsFullAutoplay(false);
            return;
          }

          // Otherwise, choose strategically for the AI player
          const hand = (workState.sets.heldSets || []).filter(s => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(curId));
          const pick = GeneralSelectionManager.chooseGeneral(
            workState.availableGenerals,
            hand,
            workState.regions,
            workState.sets.pawns
          );
          curPlayer.generalOf = pick;
          workState.availableGenerals = workState.availableGenerals.filter(g => g !== pick);
          addLog(workState, `Gracz ${curId} wybrał Generała bandy: ${pick === 'V' ? 'Wampiry' : pick === 'W' ? 'Wilkołaki' : pick === 'G' ? 'Duchy' : 'Bardaki'}`);
          workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
          await updateGameWithSync(workState);
          return;
        }
      }

      if (workState.phase === 'player_phase') {
        const curId = workState.playerOrder[workState.currentPlayerIndex];
        const curPlayer = workState.players.find(p => p.id !== null && p.id !== undefined && String(p.id) === String(curId));
        
        // Pause autoplay and wait for manual player turn
        const isManual = (manualPlayers && manualPlayers.some(id => String(id) === String(curId))) || (playerId !== null && playerId !== undefined && String(curId) === String(playerId));
        if (isManual && !workState.passedPlayers.some(id => String(id) === String(curId))) {
          setIsFullAutoplay(false);
          return;
        }

        if (!curPlayer.generalOf) {
          const hand = (workState.sets.heldSets || []).filter(s => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(curId));
          const pick = GeneralSelectionManager.chooseGeneral(
            workState.availableGenerals,
            hand,
            workState.regions,
            workState.sets.pawns
          );
          curPlayer.generalOf = pick;
          workState.availableGenerals = workState.availableGenerals.filter(g => g !== pick);
          addLog(workState, `Gracz ${curId} wybrał Generała bandy: ${pick === 'V' ? 'Wampiry' : pick === 'W' ? 'Wilkołaki' : pick === 'G' ? 'Duchy' : 'Bardaki'}`);
          workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
          await updateGameWithSync(workState);
          return;
        }
        if (workState.passedPlayers.some(id => String(id) === String(curId))) {
          workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
          await updateGameWithSync(workState);
          return;
        }
        const globalPool = { ...workState.sets.pawns };
        const playLimits = workState.sets.pawnsInPlayLimit || globalPool;
        const best = ClientPlacementManager.findBestPlacement(workState.regions, workState.sets.heldSets, curId, curPlayer.generalOf, globalPool, playLimits);

        if (best) {
          const { logSummaryString, statusLogString } = ClientPlacementManager.executePlacement(best, workState, PAWN_TYPES, playLimits);
           addLog(workState, `Gracz ${curId} wystawił Zestaw ${best.set.id} w sektorze [${best.region.x},${best.region.y}] [${logSummaryString}] | Plansza: ${statusLogString}`);
        } else {
          const excess = ClientPlacementManager.executePass(curPlayer, workState, MAX_HAND_SIZE, applySetToJakubAnger);
          if (excess > 0) {
            addLog(workState, `Gracz ${curId} spasował i podkablował ${excess} nadmiarowych zestawów. Furia Jakuba zaktualizowana.`, { race: curPlayer.generalOf, points: excess });
          } else {
            addLog(workState, `Gracz ${curId} spasował.`);
          }
        }
        if (workState.passedPlayers.length === workState.players.length) {
          workState.phase = 'jakub_phase'; addLog(workState, `--- Start Fazy Jakuba ---`);
        } else workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
        await updateGameWithSync(workState);
        return;
      }

      if (workState.phase === 'jakub_phase') {
        const step = executeJakubStep(workState);
        let updatedState = workState;
        if (step.actionTaken || (step.metadata && step.metadata.swiadekPointsAwarded && step.metadata.swiadekPointsAwarded.length > 0)) { 
          addLog(step.newState, step.log, step.metadata || {}); 
          if (step.metadata && step.metadata.swiadekPointsAwarded) {
            step.metadata.swiadekPointsAwarded.forEach(r => {
              addLog(step.newState, `🔥 Świadek Jakuba: ${r.player} (${r.race === 'V' ? 'Wampiry' : r.race === 'W' ? 'Wilkołaki' : r.race === 'G' ? 'Duchy' : 'Bardaki'}) zdobywa ${r.points} bonusowych punktów za przeżycie w pobliżu Jakuba.`, { race: r.race, points: r.points });
            });
          }
          updatedState = step.newState;
          if (step.actionTaken) {
            await updateGameWithSync(updatedState); 
            return;
          }
        }
        
        workState = updatedState;
        addLog(workState, `Jakub kończy swoje łowy.`);
        let jakub = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }
        if (jakub) { 
          jakub.range = 1; 
          addLog(workState, `Zasięg Jakuba zresetowany do 1.`); 
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
            addLog(workState, `--- FAZA PUNKTACJI KOŃCOWEJ (08:00) ---`); 
          }
          else { 
            workState.phase = 'event_phase'; 
            addLog(workState, `--- FAZA EVENTU ---`); 
          }
          
          if (!isFullAutoplay) {
            setIsJakubAutoplay(false); // Stop if it was only Jakub mode
          }
          
          await updateGameWithSync(workState);
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
              const drawn = data.state.events?.drawn;
              if (drawn && drawn.length > 0) {
                const latestEvent = drawn[drawn.length - 1];
                setAutoplayEventPopup({
                  event: latestEvent,
                  ticksLeft: 6
                });
              }
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
          addLog(workState, `Punktacja Końcowa: Gracz ${curPlayer.id} (+${addedPoints} za bandę ${pick === 'V' ? 'Wampiry' : pick === 'W' ? 'Wilkołaki' : pick === 'G' ? 'Duchy' : 'Bardaki'});`);
        });

        workState.phase = 'End Game';
        workState.gameStatus = 'finished';
        
        const maxPoints = Math.max(...workState.players.map(p => p.points));
        const winners = workState.players.filter(p => p.points === maxPoints);
        
        if (winners.length > 1) {
          addLog(workState, `KONIEC GRY! REMIS pomiędzy graczami: ${winners.map(w => w.id).join(', ')} z liczbą punktów: ${maxPoints}!`);
        } else {
          addLog(workState, `KONIEC GRY! Zwycięzca: Gracz ${winners[0].id} z liczbą punktów: ${maxPoints}.`);
        }

        setIsFullAutoplay(false);
        setIsJakubAutoplay(false);
        await updateGameWithSync(workState);
        return;
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [isFullAutoplay, isJakubAutoplay, gameId, gameState, updateGameWithSync, addLog, drawSet, manualPlayers, playerId, autoplayEventPopup]);

  useEffect(() => {
    const timer = setInterval(() => { 
      if (isFullAutoplay || isJakubAutoplay) handleAutoplayTick(); 
    }, autoplaySpeed);
    return () => clearInterval(timer);
  }, [isFullAutoplay, isJakubAutoplay, autoplaySpeed, handleAutoplayTick]);

  useEffect(() => {
    if (!isFullAutoplay && !isJakubAutoplay) {
      setAutoplayEventPopup(null);
    }
  }, [isFullAutoplay, isJakubAutoplay]);

  return {
    isFullAutoplay,
    setIsFullAutoplay,
    isJakubAutoplay,
    setIsJakubAutoplay,
    autoplaySpeed,
    setAutoplaySpeed,
    findAndRemoveSetById,
    autoplayEventPopup,
    setAutoplayEventPopup
  };
};
