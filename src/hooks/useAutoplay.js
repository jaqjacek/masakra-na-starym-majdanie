import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TOTAL_GAME_ROUNDS, 
  DEFAULT_AUTOPLAY_SPEED,
  JAKUB_BASE_RANGE,
  SERVER_URL
} from '../constants/constants';
import { RACES } from '../constants/game';
import { Board } from '../constants/board';
import { executeJakubStep } from '../strategies/jakubStrategy';
import { VampireScoring } from '../../shared/scoring/vampireScoring.js';
import { WerewolfScoring } from '../../shared/scoring/werewolfScoring.js';
import { GhostScoring } from '../../shared/scoring/ghostScoring.js';
import { BardakScoring } from '../../shared/scoring/bardakScoring.js';
import { trackPointsChange } from '../../shared/statsManager.js';
import { MilosierdzieManager } from '../../shared/milosierdzieManager.js';
import { isSpectatorClientLocked } from './useGameState';

export const FLOAT_ANIMATION_MS = 1500;
const MAX_KILL_DELAY_MS = 1000;

export function killStepDelay(autoplaySpeed) {
  const tick = Number(autoplaySpeed);
  const safe = Number.isFinite(tick) && tick > 0 ? tick : DEFAULT_AUTOPLAY_SPEED;
  return Math.min(safe * 2, MAX_KILL_DELAY_MS);
}
const AHEAD_OF_EVENT = new Set(['setup', 'general_phase', 'player_phase', 'final_scoring', 'End Game']);

export const useAutoplay = ({ 
  gameId, 
  gameState, 
  setGameState,
  updateGameWithSync, 
  addLog,
  manualPlayers,
  playerId,
  dispatchAction
}) => {
  const [isFullAutoplay, setIsFullAutoplay] = useState(false);
  const [isJakubAutoplay, setIsJakubAutoplay] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(DEFAULT_AUTOPLAY_SPEED);
  const [autoplayEventPopup, setAutoplayEventPopup] = useState(null);
  const isProcessingRef = useRef(false);
  const animationHoldUntilRef = useRef(0);
  const eventLockRef = useRef(null);
  const setupDrawAtRef = useRef(0);
  const tickRef = useRef(null);
  const killTimerRef = useRef(null);

  const holdForAnimations = useCallback((ms) => {
    if (!ms || ms <= 0) return;
    animationHoldUntilRef.current = Math.max(animationHoldUntilRef.current, Date.now() + ms);
  }, []);

  /** Hold autoplay for `delay` ms, then tick immediately instead of waiting for the next interval. */
  const scheduleNextStep = useCallback((delay) => {
    if (!delay || delay <= 0) return;
    animationHoldUntilRef.current = Date.now() + delay;
    if (killTimerRef.current) clearTimeout(killTimerRef.current);
    killTimerRef.current = setTimeout(() => {
      killTimerRef.current = null;
      animationHoldUntilRef.current = 0;
      tickRef.current?.();
    }, delay);
  }, []);

  const visualHoldMs = useCallback((step) => {
    const meta = step?.metadata || {};
    if (meta.killedInfo && meta.killedInfo.length > 0) return killStepDelay(autoplaySpeed);
    // Magnetism shows a banner that must be readable; hold for the full float.
    if (meta.magnetismStart || meta.magnetismPull) return Math.max(autoplaySpeed, FLOAT_ANIMATION_MS);
    // Witness "+N" floats are CSS-only and keep animating while Jakub moves on.
    if (meta.swiadekPointsAwarded && meta.swiadekPointsAwarded.length > 0) return killStepDelay(autoplaySpeed);
    if (step?.actionTaken) return autoplaySpeed;
    return 0;
  }, [autoplaySpeed]);

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
    if (isSpectatorClientLocked()) return;
    if (gameState.phase !== 'event_phase') {
      eventLockRef.current = null;
    }
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
    if (Date.now() < animationHoldUntilRef.current) return;
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
        if (dispatchAction) {
          const sinceDraw = Date.now() - setupDrawAtRef.current;
          if (sinceDraw < Math.max(autoplaySpeed * 5, 500)) return;
          setupDrawAtRef.current = Date.now();
          dispatchAction('drawSets');
          return;
        }
        workState.phase = 'general_phase';
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
          workState.playerOrder = [...workState.players].sort((a, b) => b.points - a.points).map(p => p.id);
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

          const isManual = manualPlayers && manualPlayers.some(id => String(id) === String(curId));
          if (isManual) {
            return;
          }
          return;
        }
      }

      if (workState.phase === 'player_phase') {
        const curId = workState.playerOrder[workState.currentPlayerIndex];
        
        const isManual = manualPlayers && manualPlayers.some(id => String(id) === String(curId));
        if (isManual && !workState.passedPlayers.some(id => String(id) === String(curId))) {
          return;
        }
        return;
      }

      if (workState.phase === 'jakub_phase') {
        const step = executeJakubStep(workState);
        let updatedState = workState;
        if (step.actionTaken || (step.metadata && step.metadata.swiadekPointsAwarded && step.metadata.swiadekPointsAwarded.length > 0)) { 
          addLog(step.newState, step.log, step.metadata || {}); 
          if (step.metadata && step.metadata.swiadekPointsAwarded) {
            step.metadata.swiadekPointsAwarded.forEach(r => {
              addLog(step.newState, `🔥 Świadek Jakuba: ${r.player} (${r.race === 'vampire' ? 'Wampiry' : r.race === 'werewolf' ? 'Wilkołaki' : r.race === 'ghost' ? 'Duchy' : 'Bardaki'}) zdobywa ${r.points} bonusowych punktów za przeżycie w pobliżu Jakuba.`, { race: r.race, points: r.points, type: 'witness_points', regionId: r.regionId });
            });
          }
          if (step.metadata && step.metadata.magnetism) {
            step.newState.magnetismCount = (step.newState.magnetismCount || 0) + 1;
          }
          updatedState = step.newState;
          if (step.actionTaken) {
            await updateGameWithSync(updatedState);
            scheduleNextStep(visualHoldMs(step));
            return;
          }
        }
        
        workState = updatedState;
        addLog(workState, `Jakub kończy swoje łowy.`);
        let jakub = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }
        if (jakub) {
          if (workState.mercyActive !== false) {
            const rewards = MilosierdzieManager.applyMercy(jakub, workState.players);
            rewards.forEach(reward => {
              const raceNamePl = reward.race === 'vampire' ? 'Wampiry' : reward.race === 'werewolf' ? 'Wilkołaki' : reward.race === 'ghost' ? 'Duchy' : 'Bardaki';
              addLog(workState, `😇 Miłosierdzie Jakuba: ${reward.playerName} (${raceNamePl}) otrzymuje +${reward.points} pkt za pozostałą furię.`, { race: reward.race, points: reward.points, type: 'mercy_points' });
              
              const p = workState.players.find(x => x.id === reward.playerId);
              if (p) {
                trackPointsChange(p, reward.race, reward.points, 'mercy');
              }
            });
          }
        }
        if (jakub) { 
          jakub.range = JAKUB_BASE_RANGE; 
          addLog(workState, `Zasięg Jakuba zresetowany do ${JAKUB_BASE_RANGE}.`); 
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
          delete workState.witnessGlows;

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
          holdForAnimations(visualHoldMs(step));
        return;
      }

      if (workState.phase === 'event_phase') {
        if (!isFullAutoplay) return;
        const lockKey = `${workState.currentRound}`;
        if (eventLockRef.current === lockKey) return;
        eventLockRef.current = lockKey;
        try {
          const res = await fetch(`${SERVER_URL}/api/map/${gameId}/event-phase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'event phase failed');
          const ahead = data.state && (
            AHEAD_OF_EVENT.has(data.state.phase)
            || Number(data.state.currentRound) > Number(workState.currentRound)
          );
          if ((data.executed || ahead) && data.state && setGameState) {
            setGameState({ ...data.state, spectatorAction: null });
          }
          if (data.executed && data.event) {
            setAutoplayEventPopup({ event: data.event, ticksLeft: 6 });
          } else if (!data.executed && !ahead) {
            eventLockRef.current = null;
            holdForAnimations(Math.max(autoplaySpeed, 300));
          }
        } catch (err) {
          console.error('Autoplay event phase failed:', err);
          eventLockRef.current = null;
          holdForAnimations(Math.max(autoplaySpeed, 1000));
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
          trackPointsChange(curPlayer, pick, addedPoints, 'final');
          addLog(workState, `Punktacja Końcowa: Gracz ${curPlayer.id} (+${addedPoints} za bandę ${pick === 'vampire' ? 'Wampiry' : pick === 'werewolf' ? 'Wilkołaki' : pick === 'ghost' ? 'Duchy' : 'Bardaki'});`);
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
  }, [isFullAutoplay, isJakubAutoplay, gameId, gameState, setGameState, updateGameWithSync, addLog, dispatchAction, manualPlayers, playerId, autoplayEventPopup, autoplaySpeed, holdForAnimations, visualHoldMs, scheduleNextStep]);

  useEffect(() => {
    tickRef.current = handleAutoplayTick;
  }, [handleAutoplayTick]);

  useEffect(() => {
    const timer = setInterval(() => { 
      if (isFullAutoplay || isJakubAutoplay) handleAutoplayTick(); 
    }, autoplaySpeed);
    return () => clearInterval(timer);
  }, [isFullAutoplay, isJakubAutoplay, autoplaySpeed, handleAutoplayTick]);

  useEffect(() => {
    if (!isFullAutoplay && !isJakubAutoplay) {
      setAutoplayEventPopup(null);
      if (killTimerRef.current) {
        clearTimeout(killTimerRef.current);
        killTimerRef.current = null;
      }
      animationHoldUntilRef.current = 0;
    }
  }, [isFullAutoplay, isJakubAutoplay]);

  useEffect(() => () => {
    if (killTimerRef.current) clearTimeout(killTimerRef.current);
  }, []);

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
