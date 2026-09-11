import React, { useState, useCallback, useMemo, useEffect } from 'react';
import './assets/css/base.css';
import './assets/css/layout.css';
import './assets/css/popups.css';
import './assets/css/effects.css';
import './assets/css/mobile.css';
import './assets/css/panels/setup.css';
import './assets/css/panels/scoring.css';
import './assets/css/panels/end-game.css';
import { useTranslation } from './hooks/useTranslation';

// Components
import BoardComponent from './components/Board';
import Bag from './components/Bag';
import MouseElement from './components/MouseElement';
import LandingPage from './components/LandingPage';
import GameHeader from './components/GameHeader';
import JakubPanel from './components/panels/JakubPanel';
import SetsPanel from './components/panels/SetsPanel';
import PlayersPanel from './components/panels/PlayersPanel';
import MobileTabBar from './components/panels/MobileTabBar';
import GamePanel, { GameTabBody } from './components/panels/GamePanel';
import AdminSets from './components/AdminSets';
import AdminSimulate from './components/AdminSimulate';
import AdminEvents from './components/AdminEvents';
import AdminNav from './components/AdminNav';
import GameRulesPage from './components/docs/GameRulesPage';
import HistoryPanel from './components/panels/HistoryPanel';
import EventsPanel from './components/panels/EventsPanel';
import LoadSavesPanel from './components/panels/LoadSavesPanel';
import PawnStatusPopup from './components/PawnStatusPopup';
import Footer from './components/Footer';

// Hooks
import { useGameState } from './hooks/useGameState';
import { useAutoplay } from './hooks/useAutoplay';
import { useGameInteraction } from './hooks/useGameInteraction';
import { useMobileUi } from './hooks/useMobileUi';
import { trackGeneralSelection } from '../shared/statsManager.js';

// Constants & Utilities
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from './constants/pawnTypes';
import { RACES, INITIAL_STATE } from './constants/game';
import { applySetToJakubAnger, getRegionsInRange } from './strategies/jakubStrategy';

import { GeneralSelectionManager } from '../shared/generalSelectionManager.js';
import { TOTAL_GAME_ROUNDS, SERVER_URL, computeJakubRange } from './constants/constants';
import { RACE_TO_ABBR } from '../shared/constants.js';
import { ClientPlacementManager } from './logic/clientPlacementManager';
import { Scoring } from '../shared/scoring/scoring.js';

const SetGhostPointsPopup = ({ regions, hoveredRegionId, activeSet }) => {
  if (!regions || hoveredRegionId === null || !activeSet || !activeSet.set || !activeSet.set.content) {
    return null;
  }
  const targetRegion = regions.find(r => r && r.id === hoveredRegionId);
  if (!targetRegion) return null;

  let placementScores;
  try {
    placementScores = Scoring.calculatePlacementPoints(regions, targetRegion, activeSet.set.content);
  } catch (err) {
    console.error("Error calculating placement points:", err);
    return null;
  }

  if (!placementScores) return null;

  const RACES_ORDER = ['vampire', 'werewolf', 'ghost', 'bardak'];

  return (
    <div className="set-ghost-points-popup">
      {RACES_ORDER.map(race => {
        const abbr = RACE_TO_ABBR[race];
        const pts = placementScores[abbr] || 0;
        const ptsClass = pts > 0 ? 'pts-positive' : pts < 0 ? 'pts-negative' : 'pts-zero';
        const ptsString = pts >= 0 ? `+${pts}` : `${pts}`;

        return (
          <div key={race} className="popup-item">
            <div className={`set-icon ${race}`} />
            <span className={`race-pts ${ptsClass}`}>{ptsString}</span>
          </div>
        );
      })}
    </div>
  );
};

function App() {
  const { t } = useTranslation();
  const { isMobileUi, uiLayout, setUiLayout } = useMobileUi();
  const [mobileTab, setMobileTab] = useState('players');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [pawnRemoveTarget, setPawnRemoveTarget] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSetsPanelOpen, setIsSetsPanelOpen] = useState(false);
  const [isEventsPanelOpen, setIsEventsPanelOpen] = useState(false);
  const [isScoringPopupOpen, setIsScoringPopupOpen] = useState(false);
  const [isLoadSavesPanelOpen, setIsLoadSavesPanelOpen] = useState(false);
  const [hoveredRegionId, setHoveredRegionId] = useState(null);
  const [isEndGamePopupOpen, setIsEndGamePopupOpen] = useState(false);
  const [showTracks, setShowTracks] = useState(() => localStorage.getItem('showTracks') !== 'false');
  const [showCounters, setShowCounters] = useState(() => localStorage.getItem('showCounters') !== 'false');
  const [showAnimations, setShowAnimations] = useState(() => localStorage.getItem('showAnimations') !== 'false');
  const [autoClickNext, setAutoClickNext] = useState(() => localStorage.getItem('autoClickNext') !== 'false');
  const [miniBoard, setMiniBoard] = useState(() => localStorage.getItem('miniBoard') === 'true');
  const [visualEffects, setVisualEffects] = useState([]);
  const prevRegionsRef = React.useRef();

  useEffect(() => {
    localStorage.setItem('showTracks', showTracks);
  }, [showTracks]);

  useEffect(() => {
    localStorage.setItem('showCounters', showCounters);
  }, [showCounters]);

  useEffect(() => {
    localStorage.setItem('showAnimations', showAnimations);
  }, [showAnimations]);

  useEffect(() => {
    localStorage.setItem('autoClickNext', autoClickNext);
  }, [autoClickNext]);

  useEffect(() => {
    localStorage.setItem('miniBoard', miniBoard);
  }, [miniBoard]);

  // 1. Basic state and sync
  const {
    gameId, setGameId, playerId, gameState, setGameState, isLoaded, currentPath, isAdminPath, updateGameWithSync, addLog, dispatchAction
  } = useGameState();

  const manualPlayers = useMemo(() => gameState.manualPlayers || [], [gameState.manualPlayers]);

  const handleToggleManualPlayer = useCallback((id) => {
    const workState = JSON.parse(JSON.stringify(gameState));
    if (!workState.manualPlayers) workState.manualPlayers = [];

    const numericId = parseInt(id, 10);
    const idToUse = Number.isNaN(numericId) ? id : numericId;
    const alreadyManual = workState.manualPlayers.some((x) => String(x) === String(idToUse));

    if (alreadyManual) {
      workState.manualPlayers = workState.manualPlayers.filter((x) => String(x) !== String(idToUse));
    } else {
      workState.manualPlayers.push(idToUse);
    }
    updateGameWithSync(workState);
  }, [gameState, updateGameWithSync]);

  useEffect(() => {
    if (isLoaded && gameId && playerId !== null && playerId !== undefined) {
      dispatchAction('claimPlayer');
    }
  }, [isLoaded, gameId, playerId, dispatchAction]);

  // Toggle html class for scrolling
  useEffect(() => {
    const isScrollablePath = isAdminPath || currentPath === '/docs/game';
    if (isAdminPath) {
      document.documentElement.classList.add('admin-mode');
    } else {
      document.documentElement.classList.remove('admin-mode');
    }

    if (isScrollablePath) {
      document.documentElement.classList.add('scrollable');
    } else {
      document.documentElement.classList.remove('scrollable');
    }
  }, [isAdminPath, currentPath]);

  // Open End Game rankings popup automatically when phase changes to 'End Game'
  useEffect(() => {
    if (gameState.phase === 'End Game') {
      setIsEndGamePopupOpen(true);
    } else {
      setIsEndGamePopupOpen(false);
    }
  }, [gameState.phase]);
  // Track pawn deaths and spawn visual effects
  useEffect(() => {
    if (gameState.regions && prevRegionsRef.current) {
      const newEffects = [];
      gameState.regions.forEach((region, i) => {
        const prevRegion = prevRegionsRef.current[i];
        if (!prevRegion) return;

        ['vampire', 'werewolf', 'ghost', 'bardak'].forEach(race => {
          const prevCount = prevRegion.pawns[race]?.length || 0;
          const currCount = region.pawns[race]?.length || 0;
          if (currCount < prevCount && !(gameState.magnetismPullRegions && gameState.magnetismPullRegions.includes(region.id))) {
            const diff = prevCount - currCount;
            for (let i = 0; i < diff; i++) {
              const id = Date.now() + Math.random();
              let prefix = '';
              if (race === 'vampire') prefix = 'V';
              if (race === 'werewolf') prefix = 'W';
              if (race === 'ghost') prefix = 'G';
              if (race === 'bardak') prefix = 'B';
              
              newEffects.push({
                id: `exp-${id}`,
                type: 'explosion',
                regionId: region.id,
                race,
                timestamp: Date.now()
              });
              newEffects.push({
                id: `txt-${id}`,
                type: 'text',
                regionId: region.id,
                race,
                text: `${prefix} -1 Pkt`,
                timestamp: Date.now()
              });
            }
          }
        });
      });

      if (newEffects.length > 0) {
        setVisualEffects(prev => [...prev, ...newEffects]);
        // Auto-cleanup after 1.5 seconds
        setTimeout(() => {
          setVisualEffects(prev => prev.filter(e => !newEffects.find(ne => ne.id === e.id)));
        }, 1500);
      }
    }
    prevRegionsRef.current = gameState.regions;
  }, [gameState.regions, gameState.magnetismPullRegions]);

  const prevHistoryLengthRef = React.useRef(0);
  useEffect(() => {
    if (gameState.history) {
      const currentLength = gameState.history.length;
      const prevLength = prevHistoryLengthRef.current;
      if (currentLength > prevLength) {
        const newLogs = gameState.history.slice(prevLength);
        const newEffects = [];
        newLogs.forEach(log => {
          if (log.type === 'witness_points' && log.regionId) {
            const id = Date.now() + Math.random();
            let prefix = '';
            if (log.race === 'vampire') prefix = 'V';
            if (log.race === 'werewolf') prefix = 'W';
            if (log.race === 'ghost') prefix = 'G';
            if (log.race === 'bardak') prefix = 'B';
            
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
              race: 'vampire', // to give it a red color
              text: t('animal_magnetism_text', { defaultValue: 'Unstoppable Animal Magnetism' }),
              isMagnetism: true,
              timestamp: Date.now()
            });
          }
        });

        if (newEffects.length > 0) {
          setVisualEffects(prev => [...prev, ...newEffects]);
          setTimeout(() => {
            setVisualEffects(prev => prev.filter(e => !newEffects.find(ne => ne.id === e.id)));
          }, 1500);
        }
      }
      prevHistoryLengthRef.current = currentLength;
    }
  }, [gameState.history]);

  // 2. Computed values
  const counters = useMemo(() => {
    const breakdown = PAWN_TYPES.reduce((acc, pawn) => { acc[pawn.id] = 0; return acc; }, {});
    const onBoard = PAWN_TYPES.reduce((acc, pawn) => { acc[pawn.id] = 0; return acc; }, {});
    let total = 0;
    if (gameState.regions) {
      gameState.regions.forEach(region => {
        Object.entries(region.pawns).forEach(([typeId, instances]) => {
          if (breakdown[typeId] !== undefined && Array.isArray(instances)) {
            breakdown[typeId] += instances.length; 
            onBoard[typeId] += instances.length;
            total += instances.length;
          }
        });
      });
    }
    return { total, breakdown, onBoard };
  }, [gameState.regions]);

  const availablePool = useMemo(() => {
    if (!gameState.sets || !gameState.sets.pawns) return {};
    const pool = { ...gameState.sets.pawns };
    const available = {};
    Object.keys(pool).forEach(race => { 
      available[race] = Math.max(0, pool[race] - (counters.breakdown[race] || 0));
    });
    return available;
  }, [gameState.sets, counters.breakdown]);

  const placementPool = useMemo(() => {
    const limits = gameState.sets?.pawnsInPlayLimit || gameState.sets?.pawns || {};
    const placement = {};
    Object.keys(availablePool).forEach(race => {
      const remainingOnBoard = Math.max(0, (limits[race] || 999) - (counters.onBoard[race] || 0));
      placement[race] = Math.min(availablePool[race], remainingOnBoard);
    });
    return placement;
  }, [availablePool, gameState.sets, counters.onBoard]);

  const isJakubOnBoard = useMemo(() => (counters.breakdown['jakub'] || 0) > 0, [counters.breakdown]);

  const jakubRegion = useMemo(() => gameState.regions?.find(r => r.pawns.jakub && r.pawns.jakub.length > 0), [gameState.regions]);

  const jakubInstance = useMemo(() => {
    if (jakubRegion) return jakubRegion.pawns.jakub[0];
    const jakubType = PAWN_TYPES.find(p => p.id === 'jakub');
    return { ...jakubType.defaultParameters, statuses: [], isVirtual: true };
  }, [jakubRegion]);

  // 3. Autoplay logic
  const {
    isFullAutoplay, setIsFullAutoplay, isJakubAutoplay, setIsJakubAutoplay,
    autoplaySpeed, setAutoplaySpeed, findAndRemoveSetById,
    autoplayEventPopup
  } = useAutoplay({ gameId, gameState, updateGameWithSync, addLog, manualPlayers, playerId, dispatchAction });

  const advanceTurn = useCallback((state) => {
    if (state.passedPlayers.length >= state.players.length) return;
    let nextIdx = (state.currentPlayerIndex + 1) % state.playerOrder.length;
    let safety = 0;
    while (state.passedPlayers.includes(state.playerOrder[nextIdx]) && safety < 10) {
      nextIdx = (nextIdx + 1) % state.playerOrder.length;
      safety++;
    }
    state.currentPlayerIndex = nextIdx;
  }, []);

  const handleExecuteManualTurn = useCallback(async (playerId, action) => {
    const workState = JSON.parse(JSON.stringify(gameState));
    const curPlayer = workState.players.find(p => p.id !== null && p.id !== undefined && String(p.id) === String(playerId));
    if (!curPlayer) return;

    if (workState.turnActionExecuted) {
      workState.turnActionExecuted = false;
      advanceTurn(workState);
      if (workState.passedPlayers.length === workState.players.length) {
        workState.phase = 'jakub_phase';
        addLog(workState, `--- Start Fazy Jakuba ---`);
      }
      updateGameWithSync(workState);
      setIsFullAutoplay(true);
      return;
    }

    if (action === 'next') {
      const globalPool = { ...workState.sets.pawns };
      const playLimits = workState.sets.pawnsInPlayLimit || globalPool;
      
      if (!curPlayer.generalOf) {
        const hand = (workState.sets.heldSets || []).filter(s => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(playerId));
        const pick = GeneralSelectionManager.chooseGeneral(
          workState.availableGenerals,
          hand,
          workState.regions,
          workState.sets.pawns
        );
        curPlayer.generalOf = pick;
        workState.availableGenerals = workState.availableGenerals.filter(g => g !== pick);
        trackGeneralSelection(curPlayer, pick);
        addLog(workState, `Gracz ${playerId} wybrał Generała bandy: ${pick === 'vampire' ? 'Wampiry' : pick === 'werewolf' ? 'Wilkołaki' : pick === 'ghost' ? 'Duchy' : 'Bardaki'}`);
      }

      const best = ClientPlacementManager.findBestPlacement(workState.regions, workState.sets.heldSets, playerId, curPlayer.generalOf, globalPool, playLimits, workState.currentRound);
      if (best) {
        const { logSummaryString, statusLogString } = ClientPlacementManager.executePlacement(best, workState, PAWN_TYPES, playLimits);
        addLog(workState, `Gracz ${playerId} wystawił Zestaw ${best.set.id} [${logSummaryString}] | Plansza: ${statusLogString}`);
        advanceTurn(workState);
      } else {
        alert(t('no_valid_moves'));
        return;
      }
    } else if (action === 'pass') {
      const excess = ClientPlacementManager.executePass(curPlayer, workState, applySetToJakubAnger);
      if (excess > 0) {
        addLog(workState, `Gracz ${playerId} spasował i podkablował ${excess} nadmiarowych zestawów. Furia Jakuba zaktualizowana.`, { race: curPlayer.generalOf, points: excess });
      } else {
        addLog(workState, `Gracz ${playerId} spasował.`);
      }
      advanceTurn(workState);
    }

    if (workState.passedPlayers.length === workState.players.length) {
      workState.phase = 'jakub_phase';
      addLog(workState, `--- Start Fazy Jakuba ---`);
    }

    updateGameWithSync(workState);
    setIsFullAutoplay(true);
  }, [gameState, updateGameWithSync, addLog, advanceTurn, setIsFullAutoplay, t]);

  // 4. Interaction logic
  const {
    activePawn, activeSet, activeGeneral, hoveredPawn, setHoveredPawn, validMoveTargets,
    handleBagMouseDown, handleJakubMouseDownFromPanel, handleSetMouseDown, handleGeneralMouseDown,
    handlePawnMouseDown, handleRegionMouseUp, handlePlayerMouseUp, handleJakubMouseUp, cancelSelection
  } = useGameInteraction({
    gameId, playerId, gameState, availablePool, placementPool, counters, isJakubOnBoard, updateGameWithSync, addLog, findAndRemoveSetById, advanceTurn, manualPlayers, autoClickNext, isMobileUi
  });

  // Reset hoveredRegionId when we stop dragging a set
  useEffect(() => {
    if (!activeSet) {
      setHoveredRegionId(null);
    }
  }, [activeSet]);

  const [jakubHoverTargets, setJakubHoverTargets] = useState([]);
  
  const handleJakubMouseEnter = useCallback(() => {
    if (jakubRegion && jakubInstance && gameState.regions) {
      const range = computeJakubRange(jakubInstance.anger);
      const targets = getRegionsInRange(gameState.regions, jakubRegion.id, range);
      setJakubHoverTargets(targets);
    }
  }, [jakubRegion, jakubInstance, gameState.regions]);

  const handleJakubMouseLeave = useCallback(() => {
    setJakubHoverTargets([]);
  }, []);

  // 5. Specific handlers
  const handleUpdatePoints = useCallback((playerIndex, delta, setToZero = false) => {
    const newState = JSON.parse(JSON.stringify(gameState));
    if (setToZero) {
      newState.players[playerIndex].points = 0;
    } else {
      newState.players[playerIndex].points = Math.max(0, newState.players[playerIndex].points + delta);
    }
    updateGameWithSync(newState);
  }, [gameState, updateGameWithSync]);

  const handleRegionRemove = useCallback((index, typeId) => {
    const newState = JSON.parse(JSON.stringify(gameState));
    if (newState.regions[index].pawns[typeId]?.length > 0) {
      newState.regions[index].pawns[typeId].pop();
      if (newState.regions[index].pawns[typeId].length === 0) delete newState.regions[index].pawns[typeId];
      updateGameWithSync(newState); setHoveredPawn(null);
    }
  }, [gameState, updateGameWithSync, setHoveredPawn]);

  const handleRegionAdd = useCallback((index, typeId) => {
    const pawnType = PAWN_TYPES.find(p => p.id === typeId);
    if (!pawnType || (pawnType.isUnique && (counters.breakdown[typeId] || 0) > 0) || availablePool[typeId] <= 0) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    const newPawn = { statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) };
    if (!newState.regions[index].pawns[typeId]) newState.regions[index].pawns[typeId] = [];
    newState.regions[index].pawns[typeId].push(newPawn);
    updateGameWithSync(newState);
  }, [gameState, counters.breakdown, availablePool, updateGameWithSync]);

  const handleJakubCounterUpdate = useCallback((path, delta, setToZero = false) => {
    const newState = JSON.parse(JSON.stringify(gameState));
    let target = null;
    for (const r of newState.regions) { if (r.pawns.jakub?.length > 0) { target = r.pawns.jakub[0]; break; } }
    if (!target) return;
    let curr = target; for (let i = 0; i < path.length - 1; i++) curr = curr[path[i]];
    if (setToZero) {
      curr[path[path.length - 1]] = 0;
    } else {
      curr[path[path.length - 1]] = Math.max(0, curr[path[path.length - 1]] + delta);
    }
    updateGameWithSync(newState);
  }, [gameState, updateGameWithSync]);

  const handleManualDrawSets = useCallback(() => {
    dispatchAction('drawSets');
  }, [dispatchAction]);

  const handleGoToPlayerPhase = useCallback(() => {
    const workState = JSON.parse(JSON.stringify(gameState));
    workState.phase = 'player_phase';
    workState.currentPlayerIndex = 0;
    workState.passedPlayers = [];
    workState.playerOrder = [...workState.players].sort((a, b) => b.points - a.points).map(p => p.id);
    addLog(workState, `--- Start Fazy Graczy (Runda ${workState.currentRound}) ---`);
    updateGameWithSync(workState);
  }, [gameState, addLog, updateGameWithSync]);

  const handleGoToJakubPhase = useCallback(async () => {
    const workState = JSON.parse(JSON.stringify(gameState));
    workState.phase = 'jakub_phase';

    addLog(workState, `--- Łowy Jakuba Rozpoczęte ---`);
    updateGameWithSync(workState);
    setIsJakubAutoplay(true); // Automatically run ONLY the Jakub phase
  }, [gameState, addLog, updateGameWithSync, setIsJakubAutoplay]);

  const handleExecuteEventPhase = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/map/${gameId}/event-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.state) {
        setGameState(data.state);
      }
    } catch (err) {
      console.error('Failed to execute event phase:', err);
      alert('Event phase failed. See console.');
    }
  }, [gameId, setGameState]);

  const handleSelectGeneral = useCallback((race) => {
    const workState = JSON.parse(JSON.stringify(gameState));
    const activeId = workState.playerOrder[workState.currentPlayerIndex];
    
    // Safety check: if playerId is defined, it must match activeId
    if (playerId !== null && playerId !== undefined && String(playerId) !== String(activeId)) {
      return;
    }
    
    const playerIdx = workState.players.findIndex(p => p.id !== null && p.id !== undefined && String(p.id) === String(activeId));
    
    if (playerIdx !== -1) {
      const player = workState.players[playerIdx];
      if (player.generalOf) return; // Already has one

      player.generalOf = race;
      workState.availableGenerals = workState.availableGenerals.filter(r => r !== race);
      trackGeneralSelection(player, race);
      addLog(workState, `Gracz ${player.id} wybrał Generała bandy: ${race === 'vampire' ? 'Wampiry' : race === 'werewolf' ? 'Wilkołaki' : race === 'ghost' ? 'Duchy' : 'Bardaki'}`);
      
      advanceTurn(workState);
      updateGameWithSync(workState);
    }
  }, [gameState, updateGameWithSync, addLog, playerId, advanceTurn]);

  const handleDeselectGeneral = useCallback((targetPlayerId) => {
    const workState = JSON.parse(JSON.stringify(gameState));
    const playerIdx = workState.players.findIndex(p => p.id !== null && p.id !== undefined && String(p.id) === String(targetPlayerId));
    
    if (playerIdx !== -1 && workState.players[playerIdx].generalOf) {
      const race = workState.players[playerIdx].generalOf;
      workState.players[playerIdx].generalOf = null;
      if (!workState.availableGenerals.includes(race)) {
        workState.availableGenerals.push(race);
      }
      addLog(workState, `Gracz ${targetPlayerId} zrezygnował z bycia Generałem bandy: ${race === 'V' ? 'Wampiry' : race === 'W' ? 'Wilkołaki' : race === 'G' ? 'Duchy' : 'Bardaki'}`);
      updateGameWithSync(workState);
    }
  }, [gameState, updateGameWithSync, addLog]);

  const handleTriggerEvent = useCallback(async (eventId) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/map/${gameId}/trigger-event/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.state) {
          setGameState(result.state);
        }
      } else {
        console.error('Failed to trigger event:', response.statusText);
      }
    } catch (err) {
      console.error('Error triggering event:', err);
    }
  }, [gameId, setGameState]);

  const handleLoadSnapshot = useCallback(async (snapshotId) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/map/${gameId}/load-snapshot/${snapshotId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.state) {
          setGameState(result.state);
          setIsLoadSavesPanelOpen(false);
        }
      } else {
        console.error('Failed to load snapshot:', response.statusText);
      }
    } catch (err) {
      console.error('Error loading snapshot:', err);
    }
  }, [gameId, setGameState]);

  // 6. Filtering
  const jakubsSets = gameState.sets ? (gameState.sets.heldSets || []).filter(s => String(s.ownerId) === 'jakub') : [];

  const canMobilePass = useMemo(() => {
    const curId = gameState.playerOrder?.[gameState.currentPlayerIndex];
    const isMyTurn = playerId !== null && playerId !== undefined && String(playerId) === String(curId);
    const isPassed = (gameState.passedPlayers || []).some((id) => String(id) === String(playerId));
    const isManual = (manualPlayers || []).some((id) => String(id) === String(playerId));
    return gameState.phase === 'player_phase' && isMyTurn && isManual && !isPassed;
  }, [gameState.phase, gameState.playerOrder, gameState.currentPlayerIndex, gameState.passedPlayers, playerId, manualPlayers]);

  useEffect(() => {
    if (!isMobileUi || !hoveredPawn) return undefined;
    const onDoc = (e) => {
      if (e.target && e.target.closest && e.target.closest('.portal-status-popup')) return;
      setHoveredPawn(null);
      setPawnRemoveTarget(null);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [isMobileUi, hoveredPawn, setHoveredPawn]);

  // Rankings and Stats Helpers
  const sortedPlayers = useMemo(() => {
    if (!gameState.players) return [];
    const raceHierarchy = ['vampire', 'werewolf', 'ghost', 'bardak'];
    return [...gameState.players].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // Tie-breaker: General in round 12
      const aRaceIndex = raceHierarchy.indexOf(a.generalOf);
      const bRaceIndex = raceHierarchy.indexOf(b.generalOf);
      return aRaceIndex - bRaceIndex;
    });
  }, [gameState.players]);

  const renderPlayerStats = (player, isSmall = false) => {
    const stats = player.stats || {
      races: {}, scores: {}, losses: {}, rambo: {}, witness: {}, final: {}, passing: {}, killedByJakub: {}, setsPlayed: {}
    };
    const racesList = ['vampire', 'werewolf', 'ghost', 'bardak'];
    const raceNames = { vampire: t('vampire'), werewolf: t('werewolf'), ghost: t('ghost'), bardak: t('bardak') };
    
    const chosenRaces = racesList.filter(race => (stats.races[race] || 0) > 0);
    
    if (chosenRaces.length === 0) {
      return <div className="no-stats-text">{t('no_stats_text')}</div>;
    }
    
    return (
      <div className={`player-stats-grid ${isSmall ? 'small' : ''}`}>
        {chosenRaces.map(race => {
          const times = stats.races[race] || 0;
          const score = stats.scores[race] || 0;
          const loss = stats.losses[race] || 0;
          const rambo = stats.rambo[race] || 0;
          const witness = stats.witness[race] || 0;
          const final = stats.final[race] || 0;
          const passing = stats.passing[race] || 0;
          const mercy = stats.mercy?.[race] || 0;
          const killed = stats.killedByJakub[race] || 0;
          const setsCount = stats.setsPlayed[race] || 0;
          
          return (
            <div key={race} className={`race-stat-row ${race}`}>
              <div className="race-header-info">
                <div className={`general-icon small ${race}`} />
                <span className="race-name">{raceNames[race]}</span>
                <span className="race-times">({times}x)</span>
              </div>
              <div className="race-metrics">
                <div className="metric-item score-metric" title={t('stats_tooltip_scored')}>
                  <span className="metric-label">{t('stats_scored')}</span>
                  <span className="metric-value">+{score}</span>
                </div>
                <div className="metric-item loss-metric" title={t('stats_tooltip_lost')}>
                  <span className="metric-label">{t('stats_lost')}</span>
                  <span className="metric-value">-{loss}</span>
                </div>
                <div className="metric-item rambo-metric" title={t('stats_tooltip_assault')}>
                  <span className="metric-label">{t('stats_assault')}</span>
                  <span className="metric-value">{rambo > 0 ? `+${rambo}` : rambo}</span>
                </div>
                <div className="metric-item witness-metric" title={t('stats_tooltip_witness')}>
                  <span className="metric-label">{t('stats_witness')}</span>
                  <span className="metric-value">+{witness}</span>
                </div>
                <div className="metric-item final-metric" title={t('stats_tooltip_final')}>
                  <span className="metric-label">{t('stats_final')}</span>
                  <span className="metric-value">+{final}</span>
                </div>
                <div className="metric-item passing-metric" title={t('stats_tooltip_passing')}>
                  <span className="metric-label">{t('stats_passing')}</span>
                  <span className="metric-value">+{passing}</span>
                </div>
                <div className="metric-item mercy-metric" title={gameState.mercyActive === false ? t('stats_mercy_disabled_tooltip', { defaultValue: 'Mercy Phase disabled' }) : t('stats_tooltip_mercy', { defaultValue: 'Points from Jakub\'s Mercy' })}>
                  <span className="metric-label">😇 {t('stats_mercy', { defaultValue: 'Mercy' })}</span>
                  <span className="metric-value">{gameState.mercyActive === false ? t('stats_no_mercy', { defaultValue: 'No mercy' }) : `+${mercy}`}</span>
                </div>
                <div className="metric-item killed-metric" title={t('stats_tooltip_killed', { defaultValue: 'Killed by Jakub' })}>
                  <span className="metric-label">💀 {t('stats_killed', { defaultValue: 'Killed' })}</span>
                  <span className="metric-value">-{killed}</span>
                </div>
                <div className="metric-item sets-metric" title={t('stats_tooltip_played_sets', { defaultValue: 'Played sets' })}>
                  <span className="metric-label">🃏 {t('stats_played_sets', { defaultValue: 'Sets' })}</span>
                  <span className="metric-value">{setsCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 7. Render logic
  const adminNotice = isMobileUi ? <div className="admin-desktop-notice">{t('admin_desktop_notice')}</div> : null;

  if (currentPath === '/docs/game') return <GameRulesPage />;
  if (currentPath === '/admin/sets') return <div className="app-container">{adminNotice}<AdminNav currentPath={currentPath} /><AdminSets /><Footer /></div>;
  if (currentPath === '/admin/events') return <div className="app-container">{adminNotice}<AdminNav currentPath={currentPath} /><AdminEvents /><Footer /></div>;
  if (currentPath === '/admin/simulate') return <div className="app-container">{adminNotice}<AdminNav currentPath={currentPath} /><AdminSimulate /><Footer /></div>;
  if (isAdminPath) return <div className="app-container">{adminNotice}<AdminNav currentPath={currentPath} /><div className="admin-page-content"><p>Please select an Admin section.</p></div><Footer /></div>;
  if (!gameId) return <LandingPage onGoToGame={(id) => { if (id) window.location.href = `/game/${id}`; }} />;

  return (
    <div className="app-container">
      <GamePanel 
        gameId={gameId}
        gameState={gameState}
        updateGameWithSync={updateGameWithSync}
        currentPlayerId={playerId}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isFullAutoplay={isFullAutoplay}
        setIsFullAutoplay={setIsFullAutoplay}
        isJakubAutoplay={isJakubAutoplay}
        setIsJakubAutoplay={setIsJakubAutoplay}
        autoplaySpeed={autoplaySpeed}
        setAutoplaySpeed={setAutoplaySpeed}
        isSetsPanelOpen={isSetsPanelOpen}
        setIsSetsPanelOpen={setIsSetsPanelOpen}
        isEventsPanelOpen={isEventsPanelOpen}
        setIsEventsPanelOpen={setIsEventsPanelOpen}
        onManualDrawSets={handleManualDrawSets}
        onGoToPlayerPhase={handleGoToPlayerPhase}
        onExecuteManualTurn={handleExecuteManualTurn}
        onGoToJakubPhase={handleGoToJakubPhase}
        onExecuteEventPhase={handleExecuteEventPhase}
        onOpenScoring={() => setIsScoringPopupOpen(true)}
        onOpenLoadSaves={() => setIsLoadSavesPanelOpen(true)}
        onOpenStats={() => setIsEndGamePopupOpen(true)}
        onCreateNewGame={async () => {
          try {
            const res = await fetch(`${SERVER_URL}/api/map/new`, { method: 'POST' });
            const data = await res.json();
            if (data.id !== undefined) window.location.href = `/game/${data.id}`;
          } catch (_err) { alert('Failed to create new game'); }
        }}
        onChangeGame={() => { window.history.pushState({}, '', '/'); setGameId(null); setGameState(INITIAL_STATE); window.dispatchEvent(new Event('popstate')); }}
        onAdminPanel={() => { window.history.pushState({}, '', '/admin/sets'); window.dispatchEvent(new Event('popstate')); }}
        serverUrl={SERVER_URL}
        initialState={INITIAL_STATE}
        showTracks={showTracks}
        setShowTracks={setShowTracks}
        showCounters={showCounters}
        setShowCounters={setShowCounters}
        showAnimations={showAnimations}
        setShowAnimations={setShowAnimations}
        autoClickNext={autoClickNext}
        setAutoClickNext={setAutoClickNext}
        miniBoard={miniBoard}
        setMiniBoard={setMiniBoard}
        isMobileUi={isMobileUi}
        uiLayout={uiLayout}
        setUiLayout={setUiLayout}
        onOpenMobileGameTab={() => { setMobileTab('game'); setMobileSheetOpen(true); }}
      />

      {isEventsPanelOpen && (
        <EventsPanel 
          events={gameState.events} 
          onClose={() => setIsEventsPanelOpen(false)} 
          onTriggerEvent={handleTriggerEvent}
        />
      )}

      {isLoadSavesPanelOpen && (
        <LoadSavesPanel 
          gameId={gameId}
          onClose={() => setIsLoadSavesPanelOpen(false)}
          onLoadSnapshot={handleLoadSnapshot}
          serverUrl={SERVER_URL}
        />
      )}

      {isSetsPanelOpen && (
        <div className="sets-modal-overlay" onClick={() => setIsSetsPanelOpen(false)}>
          <div className="sets-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setIsSetsPanelOpen(false)}>×</button>
            <SetsPanel 
              sets={gameState.sets?.drawPile || []} 
              discardedSets={gameState.sets?.discardPile || []}
              onSetMouseDown={handleSetMouseDown} 
              title="Global Sets Pool" 
              setInfo={gameState.sets} 
              discardPileCount={gameState.sets?.discardPile?.length || 0} 
              placementPool={placementPool}
              isMobileUi={isMobileUi}
              selectedSetId={activeSet?.set?.id}
            />
          </div>
        </div>
      )}

      <div className="game-layout-wrapper">
        {isMobileUi && (
          <GameHeader
            playerOrder={gameState.playerOrder}
            currentPlayerIndex={gameState.currentPlayerIndex}
            passedPlayers={gameState.passedPlayers}
            currentRound={gameState.currentRound}
            totalRounds={gameState.totalRounds || TOTAL_GAME_ROUNDS}
          />
        )}
        {!isMobileUi && (
        <div className="left-controls">
          <GameHeader
            playerOrder={gameState.playerOrder}
            currentPlayerIndex={gameState.currentPlayerIndex}
            passedPlayers={gameState.passedPlayers}
            currentRound={gameState.currentRound}
            totalRounds={gameState.totalRounds || TOTAL_GAME_ROUNDS}
          />
          <PlayersPanel
            players={gameState.players || []}
            onUpdatePoints={handleUpdatePoints}
            currentPlayerId={playerId}
            onPlayerMouseUp={handlePlayerMouseUp}
            onGeneralClick={handleDeselectGeneral}
            sets={gameState.sets}
            passedPlayers={gameState.passedPlayers || []}
            manualPlayers={manualPlayers}
            onToggleManualPlayer={handleToggleManualPlayer}
            activeTurnPlayerId={gameState.playerOrder?.[gameState.currentPlayerIndex]}
            phase={gameState.phase}
          />
          {playerId && (
            <div className="player-hand-section always-visible">
              <div className="player-hand-header">{t('player_hand_title', { player: playerId })}</div>
              <SetsPanel
                sets={(gameState.sets?.heldSets || []).filter(s => String(s.ownerId) === String(playerId))}
                onSetMouseDown={handleSetMouseDown}
                hideTabs={true}
                placementPool={placementPool}
              />
            </div>
          )}
          <div className="jakub-management">
            <JakubPanel
              jakub={jakubInstance}
              onUpdateCounter={handleJakubCounterUpdate}
              onJakubMouseDown={handleJakubMouseDownFromPanel}
              isJakubOnBoard={isJakubOnBoard}
              sets={jakubsSets}
              onMouseUp={handleJakubMouseUp}
              isDraggingSet={!!activeSet}
            />
          </div>
          <div className="bags-container">
            {PAWN_TYPES.filter(p => !p.isUnique).map(pawn => (
              <Bag
                key={pawn.id}
                type={pawn}
                onMouseDown={(e) => handleBagMouseDown(pawn.id, e)}
                availableCount={placementPool[pawn.id]}
                onBoard={counters.onBoard[pawn.id]}
                limit={gameState.sets?.pawnsInPlayLimit?.[pawn.id] || gameState.sets?.pawns?.[pawn.id]}
              />
            ))}
          </div>
        </div>
        )}
        <div className="main-game-area">
          {gameState.phase === 'general_phase' && (() => {
            const activeId = gameState.playerOrder[gameState.currentPlayerIndex];
            
            // If playerId is defined and it's not our turn to choose, we wait
            if (playerId !== null && playerId !== undefined && String(playerId) !== String(activeId)) {
              return (
                <div className="generals-pool-wrapper" style={{ textAlign: 'center', padding: '15px' }}>
                  <div className="generals-pool-header">
                    {t('waiting_for_general', { player: activeId })}
                  </div>
                </div>
              );
            }

            const player = gameState.players.find(p => p.id !== null && p.id !== undefined && String(p.id) === String(activeId));
            const hasGeneral = !!player?.generalOf;
            
            return (
              <div className="generals-pool-wrapper">
                <div className="generals-pool-header">
                  {hasGeneral ? t('general_chosen') : t('choose_general_for', { player: activeId })}
                </div>
                <div className="generals-pool-horizontal">
                  {gameState.availableGenerals.map(race => (
                    <button
                      type="button"
                      key={race}
                      className={`general-icon large portrait ${race} ${hasGeneral ? 'disabled' : ''}`}
                      onMouseDown={(e) => !hasGeneral && handleGeneralMouseDown(race, e)}
                      onClick={() => !hasGeneral && handleSelectGeneral(race)}
                      title={hasGeneral ? t('general_portrait_title') : t('general_icon_title', { race: t(race) })}
                    >
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {gameState.regions && (
            <BoardComponent 
              regions={gameState.regions} 
              onRegionMouseUp={handleRegionMouseUp} 
              onRemovePawn={handleRegionRemove} 
              onAddPawn={handleRegionAdd} 
              onPawnMouseDown={handlePawnMouseDown} 
              setHoveredPawn={setHoveredPawn} 
              validMoveTargets={validMoveTargets.length > 0 ? validMoveTargets : jakubHoverTargets}
              onRegionMouseEnter={(regionId) => { if (activeSet) setHoveredRegionId(regionId); }}
              onRegionMouseLeave={() => setHoveredRegionId(null)}
              jakubPath={gameState.jakubPath || []}
              currentRound={gameState.currentRound}
              currentPhase={gameState.phase}
              showTracks={showTracks}
              showCounters={showCounters}
              showAnimations={showAnimations}
              miniBoard={miniBoard}
              isMobileUi={isMobileUi}
              placementArmed={!!(activeSet || activePawn)}
              onLongPressPawn={(regionId, typeId, pawn, pawnType, e) => {
                setPawnRemoveTarget({ regionId, typeId });
                setHoveredPawn({ pawn, pawnType, x: e.clientX, y: e.clientY });
              }}
              visualEffects={visualEffects}
              witnessGlows={gameState.witnessGlows}
              jakubInstance={jakubInstance}
              jakubRegion={jakubRegion}
              autoplaySpeed={autoplaySpeed}
              onJakubMouseEnter={handleJakubMouseEnter}
              onJakubMouseLeave={handleJakubMouseLeave}
            >
              {autoplayEventPopup && (
                <div className="autoplay-event-popup-wrapper">
                  <div className="autoplay-event-popup-glow"></div>
                  <div className="autoplay-event-badge">⚠️ {t('active_event_badge_board', { defaultValue: 'BOARD EVENT ACTIVE' })}</div>
                  <h2 className="autoplay-event-title">{t(`event.${autoplayEventPopup.event.id}.title`, { defaultValue: autoplayEventPopup.event.title })}</h2>
                  <div className="autoplay-event-divider"></div>
                  <p className="autoplay-event-description">{t(`event.${autoplayEventPopup.event.id}.description`, { defaultValue: autoplayEventPopup.event.description })}</p>
                  <div className="autoplay-event-footer">
                    <div className="autoplay-event-ticks-container">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div 
                           key={idx} 
                           className={`autoplay-event-tick-dot ${idx < autoplayEventPopup.ticksLeft ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                    <span className="autoplay-event-countdown-text">
                      {t('resuming_autoplay_ticks', { ticks: autoplayEventPopup.ticksLeft, defaultValue: `Resuming autoplay in ${autoplayEventPopup.ticksLeft} ticks...` })}
                    </span>
                  </div>
                </div>
              )}

              {gameState.phase === 'setup' && (
                <div className="setup-summary-wrapper">
                  <div className="setup-summary-header">{t('setup_summary_header', { name: gameState.setName || t('setup_random_name', { defaultValue: 'Random' }), defaultValue: `Game Setup: ${gameState.setName || 'Random'}` })}</div>
                  <div className="setup-limits-grid">
                    <div className="setup-limit-section">
                      <h4>{t('setup_total_pawn_pool', { defaultValue: 'Total Pawn Pool' })}</h4>
                      <div className="setup-limit-list">
                        {RACES.map(race => (
                          <div key={race} className="setup-limit-item">
                            <div className={`set-icon ${race}`}></div>
                            <span>{gameState.sets?.pawns?.[race] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="setup-limit-section">
                      <h4>{t('setup_pawn_play_limits', { defaultValue: 'Pawn Play Limits' })}</h4>
                      <div className="setup-limit-list">
                        {RACES.map(race => (
                          <div key={race} className="setup-limit-item">
                            <div className={`set-icon ${race}`}></div>
                            <span>{gameState.sets?.pawnsInPlayLimit?.[race] || gameState.sets?.pawns?.[race] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="setup-hint" style={{ marginTop: '1.5rem', color: '#888', fontSize: '0.8rem' }}>
                    {t(isMobileUi ? 'setup_waiting_host_draw_mobile' : 'setup_waiting_host_draw', { defaultValue: 'Waiting for host to click "DRAW SETS" in the top bar...' })}
                  </div>
                </div>
              )}

            </BoardComponent>
          )}
        </div>
        {isMobileUi && (activeSet || activePawn || canMobilePass || gameState.phase === 'setup' || gameState.phase === 'event_phase' || (gameState.phase === 'player_phase' && (gameState.passedPlayers || []).length === (gameState.players || []).length) || (gameState.phase === 'general_phase' && (gameState.players || []).every((p) => p.generalOf))) && (
          <div className="mobile-action-bar">
            {activeSet && (
              <div className="mobile-action-preview">
                {SUMMARY_PAWN_IDS.map(typeId => {
                  const count = activeSet.set.content[typeId] || 0;
                  return Array.from({ length: count }).map((_, i) => (
                    <div key={`${typeId}-${i}`} className={`set-icon ${typeId}`}></div>
                  ));
                })}
              </div>
            )}
            {activeSet && (
              <button type="button" className="give-jakub" onClick={(e) => handleJakubMouseUp(e)}>
                {t('action_give_jakub')}
              </button>
            )}
            {(activeSet || activePawn) && (
              <button type="button" onClick={cancelSelection}>{t('action_cancel')}</button>
            )}
            {!activeSet && !activePawn && gameState.phase === 'setup' && (
              <button type="button" className="action-button next-btn" onClick={handleManualDrawSets}>{t('draw_sets')}</button>
            )}
            {!activeSet && !activePawn && gameState.phase === 'event_phase' && (
              <button type="button" className="action-button next-btn" onClick={handleExecuteEventPhase}>{t('execute_event')}</button>
            )}
            {!activeSet && !activePawn && gameState.phase === 'player_phase' && (gameState.passedPlayers || []).length === (gameState.players || []).length && (
              <button type="button" className="action-button next-btn" onClick={handleGoToJakubPhase}>{t('go_to_jakub_phase')}</button>
            )}
            {!activeSet && !activePawn && gameState.phase === 'general_phase' && (gameState.players || []).every((p) => p.generalOf) && (
              <button type="button" className="action-button next-btn" onClick={handleGoToPlayerPhase}>{t('go_to_player_phase')}</button>
            )}
            {!activeSet && !activePawn && canMobilePass && (
              <button
                type="button"
                className="pass-btn"
                onClick={() => handleExecuteManualTurn(playerId, 'pass')}
              >
                {t('pass')}
              </button>
            )}
          </div>
        )}
        {isMobileUi && playerId && (
          <div className="mobile-hand-strip">
            <SetsPanel
              sets={(gameState.sets?.heldSets || []).filter(s => String(s.ownerId) === String(playerId))}
              onSetMouseDown={handleSetMouseDown}
              hideTabs={true}
              placementPool={placementPool}
              isMobileUi={true}
              selectedSetId={activeSet?.set?.id}
            />
          </div>
        )}
        {isMobileUi && (
          <button
            type="button"
            className={`mobile-players-handle${mobileSheetOpen && mobileTab === 'players' ? ' open' : ''}`}
            onClick={() => {
              if (mobileSheetOpen && mobileTab === 'players') {
                setMobileSheetOpen(false);
              } else {
                setMobileTab('players');
                setMobileSheetOpen(true);
              }
            }}
            aria-expanded={mobileSheetOpen && mobileTab === 'players'}
            aria-label={t('players_sheet_toggle')}
            title={t('players_sheet_toggle')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M7.4 15.5 12 10.9l4.6 4.6 1.4-1.4L12 8.1 6 14.1z" />
            </svg>
          </button>
        )}
        {isMobileUi && mobileSheetOpen && (
          <button
            type="button"
            className="mobile-sheet-backdrop"
            aria-label={t('action_cancel')}
            onClick={() => setMobileSheetOpen(false)}
          />
        )}
        {isMobileUi && (
          <div className={`mobile-tab-sheet${mobileSheetOpen ? ' open' : ''}`} aria-hidden={!mobileSheetOpen}>
            {mobileTab === 'players' && (
              <PlayersPanel
                players={gameState.players || []}
                onUpdatePoints={handleUpdatePoints}
                currentPlayerId={playerId}
                onPlayerMouseUp={handlePlayerMouseUp}
                onGeneralClick={handleDeselectGeneral}
                sets={gameState.sets}
                passedPlayers={gameState.passedPlayers || []}
                manualPlayers={manualPlayers}
                onToggleManualPlayer={handleToggleManualPlayer}
                activeTurnPlayerId={gameState.playerOrder?.[gameState.currentPlayerIndex]}
                phase={gameState.phase}
                isMobileUi={true}
              />
            )}
            {mobileTab === 'jakub' && (
              <JakubPanel
                jakub={jakubInstance}
                onUpdateCounter={handleJakubCounterUpdate}
                onJakubMouseDown={handleJakubMouseDownFromPanel}
                isJakubOnBoard={isJakubOnBoard}
                sets={jakubsSets}
                onMouseUp={handleJakubMouseUp}
                isDraggingSet={!!activeSet}
                isMobileUi={true}
              />
            )}
            {mobileTab === 'game' && (
              <GameTabBody
                gameId={gameId}
                gameState={gameState}
                updateGameWithSync={updateGameWithSync}
                currentPlayerId={playerId}
                isFullAutoplay={isFullAutoplay}
                setIsFullAutoplay={setIsFullAutoplay}
                isJakubAutoplay={isJakubAutoplay}
                setIsJakubAutoplay={setIsJakubAutoplay}
                autoplaySpeed={autoplaySpeed}
                setAutoplaySpeed={setAutoplaySpeed}
                isSetsPanelOpen={isSetsPanelOpen}
                setIsSetsPanelOpen={setIsSetsPanelOpen}
                isEventsPanelOpen={isEventsPanelOpen}
                setIsEventsPanelOpen={setIsEventsPanelOpen}
                onManualDrawSets={handleManualDrawSets}
                onGoToPlayerPhase={handleGoToPlayerPhase}
                onExecuteManualTurn={handleExecuteManualTurn}
                onGoToJakubPhase={handleGoToJakubPhase}
                onExecuteEventPhase={handleExecuteEventPhase}
                onOpenScoring={() => setIsScoringPopupOpen(true)}
                onOpenLoadSaves={() => setIsLoadSavesPanelOpen(true)}
                onOpenStats={() => setIsEndGamePopupOpen(true)}
                onCreateNewGame={async () => {
                  try {
                    const res = await fetch(`${SERVER_URL}/api/map/new`, { method: 'POST' });
                    const data = await res.json();
                    if (data.id !== undefined) window.location.href = `/game/${data.id}`;
                  } catch (_err) { alert('Failed to create new game'); }
                }}
                onChangeGame={() => { window.history.pushState({}, '', '/'); setGameId(null); setGameState(INITIAL_STATE); window.dispatchEvent(new Event('popstate')); }}
                onAdminPanel={() => { window.history.pushState({}, '', '/admin/sets'); window.dispatchEvent(new Event('popstate')); }}
                showTracks={showTracks}
                setShowTracks={setShowTracks}
                showCounters={showCounters}
                setShowCounters={setShowCounters}
                showAnimations={showAnimations}
                setShowAnimations={setShowAnimations}
                autoClickNext={autoClickNext}
                setAutoClickNext={setAutoClickNext}
                miniBoard={miniBoard}
                setMiniBoard={setMiniBoard}
                uiLayout={uiLayout}
                setUiLayout={setUiLayout}
              >
                <div className="bags-container">
                  {PAWN_TYPES.filter(p => !p.isUnique).map(pawn => (
                    <Bag
                      key={pawn.id}
                      type={pawn}
                      onMouseDown={(e) => handleBagMouseDown(pawn.id, e)}
                      availableCount={placementPool[pawn.id]}
                      onBoard={counters.onBoard[pawn.id]}
                      limit={gameState.sets?.pawnsInPlayLimit?.[pawn.id] || gameState.sets?.pawns?.[pawn.id]}
                      isMobileUi={true}
                    />
                  ))}
                </div>
              </GameTabBody>
            )}
            {mobileTab === 'history' && (
              <HistoryPanel logs={gameState.history || []} />
            )}
          </div>
        )}
        {isMobileUi && (
          <MobileTabBar
            active={mobileSheetOpen ? mobileTab : null}
            onChange={(tab) => {
              if (mobileSheetOpen && mobileTab === tab) {
                setMobileSheetOpen(false);
              } else {
                setMobileTab(tab);
                setMobileSheetOpen(true);
              }
            }}
          />
        )}
        {!isMobileUi && (
        <div className="right-controls">
          <HistoryPanel logs={gameState.history || []} />
        </div>
        )}
      </div>
      
      {isScoringPopupOpen && (
        <div className="scoring-modal-overlay" onClick={() => setIsScoringPopupOpen(false)}>
          <div className="scoring-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setIsScoringPopupOpen(false)}>×</button>
            <div className="scoring-rules-container">
              <h2>{t('scoring_popup_title')}</h2>
              <div className="rules-section">
                <h3>{t('scoring_popup_immediate_title')}</h3>
                <p><span className="rules-race-icon vampire"></span><strong>{t('vampire')}:</strong> {t('scoring_popup_vampire_desc')}</p>
                <p><span className="rules-race-icon werewolf"></span><strong>{t('werewolf')}:</strong> {t('scoring_popup_werewolf_desc')}</p>
                <p><span className="rules-race-icon ghost"></span><strong>{t('ghost')}:</strong> {t('scoring_popup_ghost_desc')}</p>
                <p><span className="rules-race-icon bardak"></span><strong>{t('bardak')}:</strong> {t('scoring_popup_bardak_desc')}</p>
              </div>
              <div className="rules-section">
                <h3>{t('scoring_popup_witness_title')}</h3>
                <p>{t('scoring_popup_witness_desc')}</p>
              </div>
              <div className="rules-section">
                <h3>{t('scoring_popup_endgame_title')}</h3>
                <p><span className="rules-race-icon vampire"></span><strong>{t('vampire')}:</strong> {t('scoring_popup_endgame_vampire')}</p>
                <p><span className="rules-race-icon werewolf"></span><strong>{t('werewolf')}:</strong> {t('scoring_popup_endgame_werewolf')}</p>
                <p><span className="rules-race-icon ghost"></span><strong>{t('ghost')}:</strong> {t('scoring_popup_endgame_ghost')}</p>
                <p><span className="rules-race-icon bardak"></span><strong>{t('bardak')}:</strong> {t('scoring_popup_endgame_bardak')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEndGamePopupOpen && (
        <div className="end-game-modal-overlay" onClick={() => setIsEndGamePopupOpen(false)}>
          <div className="end-game-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setIsEndGamePopupOpen(false)}>×</button>
            <div className="end-game-header">
              <div className="trophy-glow">🏆</div>
              <h2>{t('endgame_modal_title')}</h2>
            </div>
            
            {sortedPlayers.length > 0 && (
              <div className="end-game-rankings">
                {/* 1st Place / Winner */}
                {(() => {
                  const winner = sortedPlayers[0];
                  return (
                    <div className="rank-card winner-card">
                      <div className="rank-badge gold">{t('rank_1')}</div>
                      <div className="player-details">
                        <h3 className="winner-title">{t('endgame_winner_title', { id: winner.id, name: winner.name })}</h3>
                        <div className="final-score">{t('endgame_points', { points: winner.points })}</div>
                      </div>
                      <div className="stats-breakdown">
                        {renderPlayerStats(winner)}
                      </div>
                    </div>
                  );
                })()}

                {/* 2nd, 3rd, 4th Places */}
                <div className="runners-up-grid">
                  {sortedPlayers.slice(1).map((player, idx) => {
                    const rankKey = idx === 0 ? 'rank_2' : idx === 1 ? 'rank_3' : 'rank_4';
                    const rankClass = idx === 0 ? 'silver' : idx === 1 ? 'bronze' : 'fourth';
                    return (
                      <div key={player.id} className={`rank-card runner-card ${rankClass}`}>
                        <div className={`rank-badge ${rankClass}`}>{t(rankKey)}</div>
                        <div className="player-details">
                          <h4>{t('endgame_runner_title', { id: player.id, name: player.name })}</h4>
                          <div className="final-score">{t('endgame_points', { points: player.points })}</div>
                        </div>
                        <div className="stats-breakdown">
                          {renderPlayerStats(player, true)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="end-game-footer">
              <button className="close-popup-btn" onClick={() => setIsEndGamePopupOpen(false)}>
                {t('endgame_back_to_board')}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isMobileUi && activePawn && <MouseElement type={PAWN_TYPES.find(p => p.id === activePawn.typeId)} x={activePawn.x} y={activePawn.y} />}
      {!isMobileUi && activeSet && (
        <div className="set-ghost" style={{ left: activeSet.x, top: activeSet.y }}>
          <div className="set-ghost-content">
            {SUMMARY_PAWN_IDS.map(typeId => {
              const count = activeSet.set.content[typeId] || 0;
              return Array.from({ length: count }).map((_, i) => (
                <div key={`${typeId}-${i}`} className={`set-icon ${typeId}`}></div>
              ));
            })}
          </div>
          {hoveredRegionId !== null && validMoveTargets.includes(hoveredRegionId) && (
            <SetGhostPointsPopup 
              regions={gameState.regions}
              hoveredRegionId={hoveredRegionId}
              activeSet={activeSet}
            />
          )}
        </div>
      )}
      {!isMobileUi && activeGeneral && <div className="general-ghost" style={{ left: activeGeneral.x, top: activeGeneral.y }}><div className={`general-icon large portrait ${activeGeneral.race}`}></div></div>}
      {hoveredPawn && !activePawn && !activeSet && !activeGeneral && (
        <PawnStatusPopup
          pawn={hoveredPawn.pawn}
          pawnType={hoveredPawn.pawnType}
          position={{ x: hoveredPawn.x, y: hoveredPawn.y }}
          onRemove={isMobileUi && pawnRemoveTarget ? () => {
            handleRegionRemove(pawnRemoveTarget.regionId, pawnRemoveTarget.typeId);
            setPawnRemoveTarget(null);
            setHoveredPawn(null);
          } : undefined}
        />
      )}
      {!isMobileUi && <Footer />}
    </div>
  );
}

export default App;
