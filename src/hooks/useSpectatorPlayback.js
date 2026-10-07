import { useEffect, useRef, useState } from 'react';
import { SERVER_URL, DEFAULT_AUTOPLAY_SPEED, HISTORY_LIMIT } from '../constants/constants';
import { killStepDelay } from './useAutoplay';
import { setSpectatorClientLock } from './useGameState';

const FULL_BEATS = new Set([
  'draw', 'general', 'place', 'pass', 'kablowanie', 'kill', 'move',
  'magnetism', 'event', 'final', 'jakub-end', 'phase'
]);

const MAX_PASSIVE_BEAT_MS = 200;

function beatDelay(kind, autoplaySpeed) {
  if (FULL_BEATS.has(kind)) return killStepDelay(autoplaySpeed);
  const tick = Number(autoplaySpeed);
  const safe = Number.isFinite(tick) && tick > 0 ? tick : DEFAULT_AUTOPLAY_SPEED;
  return Math.min(safe, MAX_PASSIVE_BEAT_MS);
}

export function useSpectatorPlayback({
  gameId,
  setGameState,
  autoplaySpeed,
  setIsFullAutoplay,
  setIsJakubAutoplay,
  setIsEndGamePopupOpen
}) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const speedRef = useRef(autoplaySpeed);
  const playingRef = useRef(false);
  const busyRef = useRef(false);
  speedRef.current = autoplaySpeed;

  useEffect(() => () => {
    playingRef.current = false;
    setSpectatorClientLock(false);
  }, []);

  const playFrames = (frames) => new Promise((resolve) => {
    let index = 0;
    let history = [];
    const step = () => {
      if (!playingRef.current || index >= frames.length) {
        resolve();
        return;
      }
      const frame = frames[index];
      history = [...history, ...(frame.historyDelta || [])].slice(-HISTORY_LIMIT);
      const delay = beatDelay(frame.kind, speedRef.current);
      const action = frame.spectatorAction
        ? { ...frame.spectatorAction, revealId: `replay-${frame.index}`, revealMs: delay }
        : null;
      setGameState({
        ...frame.state,
        history,
        spectatorAction: action,
        spectatorPlayback: true,
        spectatorReplay: index === frames.length - 1
      });
      index += 1;
      setTimeout(step, delay);
    };
    step();
  });

  const startSpectator = async ({ replayOnly = false } = {}) => {
    if (!gameId || busyRef.current) return;
    busyRef.current = true;
    setError('');
    setIsFullAutoplay(false);
    setIsJakubAutoplay(false);
    setIsEndGamePopupOpen(false);
    setSpectatorClientLock(true);
    setStatus(replayOnly ? 'playing' : 'recording');
    try {
      if (!replayOnly) {
        const recorded = await fetch(`${SERVER_URL}/api/map/${gameId}/spectator/start`, { method: 'POST' });
        const body = await recorded.json().catch(() => ({}));
        if (!recorded.ok) throw new Error(body.error || 'record failed');
      }
      setStatus('playing');
      const loaded = await fetch(`${SERVER_URL}/api/map/${gameId}/replay`);
      const replay = await loaded.json().catch(() => null);
      if (!loaded.ok || !replay?.frames?.length) throw new Error(replay?.error || 'replay missing');
      playingRef.current = true;
      await playFrames(replay.frames);
      playingRef.current = false;
      setGameState((prev) => ({ ...prev, spectatorPlayback: false, spectatorReplay: true, spectatorAction: null }));
      setStatus('done');
      setSpectatorClientLock(false);
      setIsEndGamePopupOpen(true);
    } catch (err) {
      playingRef.current = false;
      setSpectatorClientLock(false);
      setStatus('error');
      setError(err.message || 'spectator failed');
    } finally {
      busyRef.current = false;
    }
  };

  return {
    spectatorStatus: status,
    spectatorError: error,
    spectatorLocked: status === 'recording' || status === 'playing',
    startSpectator
  };
}
