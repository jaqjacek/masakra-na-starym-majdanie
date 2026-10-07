import { useEffect, useRef, useState } from 'react';
import { RACES, RACE_TO_ABBR } from '../../shared/constants.js';
import { currentAutoplaySpeed } from './useGameState';
import { killStepDelay, FLOAT_ANIMATION_MS } from './useAutoplay';

/** Fallback hold for a revealed placement when the server did not stamp `revealMs`. */
const DEFAULT_REVEAL_HOLD_MS = 500;

function scheduleEffects(setVisualEffects, effects, durationMs) {
  if (effects.length === 0) return;
  setVisualEffects((prev) => [...prev, ...effects]);
  setTimeout(() => {
    setVisualEffects((prev) => prev.filter((effect) => !effects.some((added) => added.id === effect.id)));
  }, durationMs);
}

/**
 * Derives board floats/explosions and the spectator banner from state changes:
 * - `spectatorAction` reveals (other players / AI / replay frames)
 * - pawn-count drops (Jakub kills), skipped for magnetism pulls
 * - new history rows (`witness_points`, `magnetismStart`)
 */
export function useBoardVisualEffects({ gameState, playerId, showAnimations, t }) {
  const [visualEffects, setVisualEffects] = useState([]);
  const [spectatorPopup, setSpectatorPopup] = useState(null);
  const prevRegionsRef = useRef();
  const seenRevealRef = useRef(null);
  const prevHistoryLengthRef = useRef(0);
  const wasPlaybackRef = useRef(false);

  useEffect(() => {
    const action = gameState.spectatorAction;
    const replayWatch = gameState.spectatorPlayback === true;
    if (!replayWatch && (playerId === null || playerId === undefined)) return;
    if (!action) {
      setSpectatorPopup(null);
      return;
    }
    if (action.revealId && action.revealId === seenRevealRef.current) return;
    seenRevealRef.current = action.revealId || null;
    if (!replayWatch && String(action.playerId) === String(playerId)) {
      setSpectatorPopup(null);
      return;
    }
    if (action.type === 'place') {
      setSpectatorPopup(null);
      const stamp = action.revealId || Date.now();
      const holdMs = action.revealMs || DEFAULT_REVEAL_HOLD_MS;
      const effects = [];
      if (showAnimations && action.regionId !== null && action.regionId !== undefined) {
        effects.push({
          id: `flash-${stamp}`,
          type: 'placement-flash',
          regionId: action.regionId,
          spectator: true,
          durationMs: holdMs
        });
      }
      (action.scores || []).forEach((score, index) => {
        if (action.regionId === null || action.regionId === undefined) return;
        const sign = score.points > 0 ? '+' : '';
        effects.push({
          id: `score-${stamp}-${index}`,
          type: 'text',
          regionId: action.regionId,
          race: score.race,
          text: `${score.abbr} ${sign}${score.points}`,
          isPositive: score.points > 0,
          spectator: true,
          stack: index,
          durationMs: holdMs,
          timestamp: Date.now()
        });
      });
      scheduleEffects(setVisualEffects, effects, holdMs);
      return;
    }
    setSpectatorPopup(action);
  }, [gameState.spectatorAction, gameState.spectatorPlayback, playerId, showAnimations]);

  // Pawn deaths → explosion + "-1" float.
  useEffect(() => {
    if (gameState.regions && prevRegionsRef.current) {
      const newEffects = [];
      const killMs = killStepDelay(currentAutoplaySpeed());
      gameState.regions.forEach((region, i) => {
        const prevRegion = prevRegionsRef.current[i];
        if (!prevRegion) return;

        RACES.forEach(race => {
          const prevCount = prevRegion.pawns[race]?.length || 0;
          const currCount = region.pawns[race]?.length || 0;
          if (currCount < prevCount && !(gameState.magnetismPullRegions && gameState.magnetismPullRegions.includes(region.id))) {
            const diff = prevCount - currCount;
            for (let k = 0; k < diff; k++) {
              const id = Date.now() + Math.random();
              const prefix = RACE_TO_ABBR[race] || '';
              newEffects.push({
                id: `exp-${id}`,
                type: 'explosion',
                regionId: region.id,
                race,
                durationMs: killMs,
                timestamp: Date.now()
              });
              newEffects.push({
                id: `txt-${id}`,
                type: 'text',
                regionId: region.id,
                race,
                text: `${prefix} -1 Pkt`,
                durationMs: killMs,
                timestamp: Date.now()
              });
            }
          }
        });
      });
      scheduleEffects(setVisualEffects, newEffects, killMs);
    }
    prevRegionsRef.current = gameState.regions;
  }, [gameState.regions, gameState.magnetismPullRegions]);

  // New history rows → witness / magnetism floats.
  useEffect(() => {
    if (gameState.spectatorPlayback && !wasPlaybackRef.current) {
      prevHistoryLengthRef.current = 0;
    }
    wasPlaybackRef.current = !!gameState.spectatorPlayback;
    if (!gameState.history) return;
    const currentLength = gameState.history.length;
    const prevLength = prevHistoryLengthRef.current;
    if (currentLength > prevLength) {
      const newLogs = gameState.history.slice(prevLength);
      const newEffects = [];
      newLogs.forEach(log => {
        if (log.type === 'witness_points' && log.regionId) {
          const id = Date.now() + Math.random();
          const prefix = RACE_TO_ABBR[log.race] || '';
          newEffects.push({
            id: `txt-${id}`,
            type: 'text',
            regionId: log.regionId,
            race: log.race,
            text: `${prefix} +${log.points} Pkt`,
            isPositive: true,
            timestamp: Date.now()
          });
        } else if (log.magnetismStart && log.regionId) {
          const id = Date.now() + Math.random();
          newEffects.push({
            id: `txt-${id}`,
            type: 'text',
            regionId: log.regionId,
            race: 'vampire', // red float color
            text: t('animal_magnetism_text', { defaultValue: 'Unstoppable Animal Magnetism' }),
            isMagnetism: true,
            timestamp: Date.now()
          });
        }
      });
      scheduleEffects(setVisualEffects, newEffects, FLOAT_ANIMATION_MS);
    }
    prevHistoryLengthRef.current = currentLength;
  }, [gameState.history, gameState.spectatorPlayback]);

  return { visualEffects, spectatorPopup };
}
