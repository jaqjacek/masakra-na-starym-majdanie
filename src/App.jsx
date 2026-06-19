import React, { useState, useCallback, useMemo, useEffect } from 'react';
import './assets/css/base.css';
import './assets/css/game.css';
import './assets/css/events.css';

// Components
import BoardComponent from './components/Board';
import Bag from './components/Bag';
import MouseElement from './components/MouseElement';
import LandingPage from './components/LandingPage';
import GameHeader from './components/GameHeader';
import JakubPanel from './components/panels/JakubPanel';
import SetsPanel from './components/panels/SetsPanel';
import PlayersPanel from './components/panels/PlayersPanel';
import AdminSets from './components/AdminSets';
import AdminSimulate from './components/AdminSimulate';
import AdminEvents from './components/AdminEvents';
import AdminNav from './components/AdminNav';
import GameRulesPage from './components/docs/GameRulesPage';
import HistoryPanel from './components/panels/HistoryPanel';
import GamePanel from './components/panels/GamePanel';
import EventsPanel from './components/panels/EventsPanel';
import LoadSavesPanel from './components/panels/LoadSavesPanel';
import PawnStatusPopup from './components/PawnStatusPopup';
import Footer from './components/Footer';

// Hooks
import { useGameState } from './hooks/useGameState';
import { useAutoplay } from './hooks/useAutoplay';
import { useGameInteraction } from './hooks/useGameInteraction';
import { trackGeneralSelection } from '../shared/statsManager.js';

// Constants & Utilities
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from './constants/pawnTypes';
import { RACES, INITIAL_STATE } from './constants/game';
import { applySetToJakubAnger } from './strategies/jakubStrategy';
import { GeneralSelectionManager } from '../shared/generalSelectionManager.js';
import { TOTAL_GAME_ROUNDS, INITIAL_HAND_SIZE, JAKUB_INITIAL_SETS, SERVER_URL, MAX_HAND_SIZE } from './constants/constants';
import { ClientPlacementManager } from './logic/clientPlacementManager';
import { Scoring } from '../shared/scoring/scoring.js';

const RACE_TO_ABBR = {
  vampire: 'V',
  werewolf: 'W',
  ghost: 'G',
  bardak: 'B'
};

const RACE_TO_LABEL = {
  vampire: 'Wampiry',
  werewolf: 'Wilkołaki',
  ghost: 'Duchy',
  bardak: 'Bardaki'
};

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSetsPanelOpen, setIsSetsPanelOpen] = useState(false);
  const [isEventsPanelOpen, setIsEventsPanelOpen] = useState(false);
  const [isScoringPopupOpen, setIsScoringPopupOpen] = useState(false);
  const [isLoadSavesPanelOpen, setIsLoadSavesPanelOpen] = useState(false);
  const [manualPlayers, setManualPlayers] = useState([]);
  const [hoveredRegionId, setHoveredRegionId] = useState(null);
  const [isEndGamePopupOpen, setIsEndGamePopupOpen] = useState(false);

  const handleToggleManualPlayer = useCallback((id) => {
    setManualPlayers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // 1. Basic state and sync
  const {
    gameId, setGameId, playerId, gameState, setGameState, currentPath, isAdminPath, updateGameWithSync, addLog
  } = useGameState();

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
  } = useAutoplay({ gameId, gameState, updateGameWithSync, addLog, manualPlayers, playerId });

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

      const best = ClientPlacementManager.findBestPlacement(workState.regions, workState.sets.heldSets, playerId, curPlayer.generalOf, globalPool, playLimits);
      if (best) {
        const { logSummaryString, statusLogString } = ClientPlacementManager.executePlacement(best, workState, PAWN_TYPES, playLimits);
        addLog(workState, `Gracz ${playerId} wystawił Zestaw ${best.set.id} [${logSummaryString}] | Plansza: ${statusLogString}`);
      } else {
        const excess = ClientPlacementManager.executePass(curPlayer, workState, MAX_HAND_SIZE, applySetToJakubAnger);
        if (excess > 0) {
          addLog(workState, `Gracz ${playerId} spasował i podkablował ${excess} nadmiarowych zestawów. Furia Jakuba zaktualizowana.`, { race: curPlayer.generalOf, points: excess });
        } else {
          addLog(workState, `Gracz ${playerId} spasował.`);
        }
      }
      advanceTurn(workState);
    } else if (action === 'pass') {
      const excess = ClientPlacementManager.executePass(curPlayer, workState, MAX_HAND_SIZE, applySetToJakubAnger);
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
  }, [gameState, updateGameWithSync, addLog, advanceTurn, setIsFullAutoplay]);

  // 4. Interaction logic
  const {
    activePawn, activeSet, activeGeneral, hoveredPawn, setHoveredPawn, validMoveTargets,
    handleBagMouseDown, handleJakubMouseDownFromPanel, handleSetMouseDown, handleGeneralMouseDown,
    handlePawnMouseDown, handleRegionMouseUp, handlePlayerMouseUp, handleJakubMouseUp
  } = useGameInteraction({
    gameId, playerId, gameState, availablePool, placementPool, counters, isJakubOnBoard, updateGameWithSync, addLog, findAndRemoveSetById, advanceTurn, manualPlayers
  });

  // Reset hoveredRegionId when we stop dragging a set
  useEffect(() => {
    if (!activeSet) {
      setHoveredRegionId(null);
    }
  }, [activeSet]);

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
    if (!gameState.players || !gameState.regions) {
      console.error("Game state incomplete, cannot draw sets.");
      return;
    }
    const workState = JSON.parse(JSON.stringify(gameState));
    if (!workState.sets) workState.sets = { drawPile: [], discardPile: [], heldSets: [] };

    const refillSets = (state) => {
      if (!state.sets.drawPile) state.sets.drawPile = [];
      if (!state.sets.discardPile) state.sets.discardPile = [];
      if (state.sets.drawPile.length === 0 && state.sets.discardPile.length > 0) {
        state.sets.drawPile = [...state.sets.discardPile];
        state.sets.discardPile = [];
        addLog(state, "Przetasowywanie stosu odrzuconego do talii dobierania.");
      }
    };
    const draw = (state) => {
      refillSets(state);
      if (state.sets.drawPile.length === 0) return null;
      const randomIdx = Math.floor(Math.random() * state.sets.drawPile.length);
      return state.sets.drawPile.splice(randomIdx, 1)[0];
    };

    let distributionCount = 0;
    workState.players.forEach(player => {
      const myHeld = (workState.sets.heldSets || []).filter(s => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(player.id));
      const needed = INITIAL_HAND_SIZE - myHeld.length;
      for (let i = 0; i < needed; i++) {
        const set = draw(workState);
        if (set) {
          set.ownerId = player.id;
          if (!workState.sets.heldSets) workState.sets.heldSets = [];
          workState.sets.heldSets.push(set);
          distributionCount++;
        }
      }
    });
    if (distributionCount > 0) addLog(workState, `Runda ${workState.currentRound}: Uzupełniono ręce graczy do ${INITIAL_HAND_SIZE} zestawów.`);
    
    // Find Jakub to update his stats
    let jakubRegionObj = workState.regions.find(r => r.pawns.jakub?.length > 0);
    let jakub = jakubRegionObj ? jakubRegionObj.pawns.jakub[0] : null;

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
      const set = draw(workState);
      if (set) {
        set.ownerId = 'jakub';
        if (!workState.sets.heldSets) workState.sets.heldSets = [];
        workState.sets.heldSets.push(set);
        
        // AUTOMATICALLY apply anger when Jakub gets a set
        if (jakub) {
          const result = applySetToJakubAnger(jakub, set.content);
          jakub.anger = result.anger;
          jakub.range = result.range;
          addLog(workState, `Jakub przejął Zestaw ${set.id}. Furia/Zasięg zaktualizowane natychmiast.`);
        } else {
          addLog(workState, `Jakub przejął Zestaw ${set.id} z puli.`);
        }
      }
    }
    workState.phase = 'general_phase';
    updateGameWithSync(workState);
  }, [gameState, addLog, updateGameWithSync]);

  const handleGoToPlayerPhase = useCallback(() => {
    const workState = JSON.parse(JSON.stringify(gameState));
    workState.phase = 'player_phase';
    workState.currentPlayerIndex = 0;
    workState.passedPlayers = [];
    addLog(workState, `--- Start Fazy Graczy (Runda ${workState.currentRound}) ---`);
    updateGameWithSync(workState);
  }, [gameState, addLog, updateGameWithSync]);

  const handleGoToJakubPhase = useCallback(async () => {
    const workState = JSON.parse(JSON.stringify(gameState));
    workState.phase = 'jakub_phase';
    workState.jakubAngerIncreased = false;
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
    // If we have a playerId in URL, we assign specifically to that player
    const targetId = playerId || workState.playerOrder[workState.currentPlayerIndex];
    const playerIdx = workState.players.findIndex(p => p.id !== null && p.id !== undefined && String(p.id) === String(targetId));
    
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

  const handleLoadRound = useCallback(async (round) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/map/${gameId}/load-round/${round}`, {
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
        console.error('Failed to load round:', response.statusText);
      }
    } catch (err) {
      console.error('Error loading round:', err);
    }
  }, [gameId, setGameState]);

  // 6. Filtering
  const jakubsSets = gameState.sets ? (gameState.sets.heldSets || []).filter(s => String(s.ownerId) === 'jakub') : [];

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
      races: {}, scores: {}, losses: {}, rambo: {}, witness: {}, final: {}, passing: {}
    };
    const racesList = ['vampire', 'werewolf', 'ghost', 'bardak'];
    const raceNames = { vampire: 'Wampiry', werewolf: 'Wilkołaki', ghost: 'Duchy', bardak: 'Bardaki' };
    
    const chosenRaces = racesList.filter(race => (stats.races[race] || 0) > 0);
    
    if (chosenRaces.length === 0) {
      return <div className="no-stats-text">Brak statystyk (nie wybrano żadnej bandy)</div>;
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
          
          return (
            <div key={race} className={`race-stat-row ${race}`}>
              <div className="race-header-info">
                <div className={`general-icon small ${race}`} />
                <span className="race-name">{raceNames[race]}</span>
                <span className="race-times">({times}x)</span>
              </div>
              <div className="race-metrics">
                <div className="metric-item score-metric" title="Zdobyte punkty na tej bandzie">
                  <span className="metric-label">Zdobyte:</span>
                  <span className="metric-value">+{score}</span>
                </div>
                <div className="metric-item loss-metric" title="Stracone punkty na tej bandzie">
                  <span className="metric-label">Stracone:</span>
                  <span className="metric-value">-{loss}</span>
                </div>
                <div className="metric-item rambo-metric" title="Punkty za zestawy (Rambo)">
                  <span className="metric-label">Szturm:</span>
                  <span className="metric-value">{rambo > 0 ? `+${rambo}` : rambo}</span>
                </div>
                <div className="metric-item witness-metric" title="Punkty Świadka Jakuba">
                  <span className="metric-label">Świadek:</span>
                  <span className="metric-value">+{witness}</span>
                </div>
                <div className="metric-item final-metric" title="Bonus na koniec gry">
                  <span className="metric-label">Koniec:</span>
                  <span className="metric-value">+{final}</span>
                </div>
                <div className="metric-item passing-metric" title="Punkty za kablowanie/pasowanie">
                  <span className="metric-label">Kablowanie:</span>
                  <span className="metric-value">+{passing}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 7. Render logic
  if (currentPath === '/docs/game') return <GameRulesPage />;
  if (currentPath === '/admin/sets') return <div className="app-container"><AdminNav currentPath={currentPath} /><AdminSets /></div>;
  if (currentPath === '/admin/events') return <div className="app-container"><AdminNav currentPath={currentPath} /><AdminEvents /></div>;
  if (currentPath === '/admin/simulate') return <div className="app-container"><AdminNav currentPath={currentPath} /><AdminSimulate /></div>;
  if (isAdminPath) return <div className="app-container"><AdminNav currentPath={currentPath} /><div className="admin-page-content"><p>Please select an Admin section.</p></div></div>;
  if (!gameId) return <LandingPage onGoToGame={(id) => { if (id) window.location.href = `/game/${id}`; }} />;

  return (
    <div className="app-container">
      <GamePanel 
        gameId={gameId}
        gameState={gameState}
        totalRounds={gameState.totalRounds || TOTAL_GAME_ROUNDS}
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
            const res = await fetch(`${SERVER_URL}/api/map/next-id`);
            const data = await res.json();
            if (data.id !== undefined) window.location.href = `/game/${data.id}`;
          } catch (_err) { alert('Failed to get new game ID'); }
        }}
        onChangeGame={() => { window.history.pushState({}, '', '/'); setGameId(null); setGameState(INITIAL_STATE); window.dispatchEvent(new Event('popstate')); }}
        onAdminPanel={() => { window.history.pushState({}, '', '/admin/sets'); window.dispatchEvent(new Event('popstate')); }}
        serverUrl={SERVER_URL}
        initialState={INITIAL_STATE}
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
          onLoadRound={handleLoadRound}
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
            />
          </div>
        </div>
      )}

      <div className="game-layout-wrapper">
        <div className="left-controls">
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
        </div>
        <div className="main-game-area">
          {gameState.regions && (
            <BoardComponent 
              regions={gameState.regions} 
              onRegionMouseUp={handleRegionMouseUp} 
              onRemovePawn={handleRegionRemove} 
              onAddPawn={handleRegionAdd} 
              onPawnMouseDown={handlePawnMouseDown} 
              setHoveredPawn={setHoveredPawn} 
              validMoveTargets={validMoveTargets}
              onRegionMouseEnter={(regionId) => { if (activeSet) setHoveredRegionId(regionId); }}
              onRegionMouseLeave={() => setHoveredRegionId(null)}
            >
              {autoplayEventPopup && (
                <div className="autoplay-event-popup-wrapper">
                  <div className="autoplay-event-popup-glow"></div>
                  <div className="autoplay-event-badge">⚠️ BOARD EVENT ACTIVE</div>
                  <h2 className="autoplay-event-title">{autoplayEventPopup.event.title}</h2>
                  <div className="autoplay-event-divider"></div>
                  <p className="autoplay-event-description">{autoplayEventPopup.event.description}</p>
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
                      Resuming autoplay in {autoplayEventPopup.ticksLeft} ticks...
                    </span>
                  </div>
                </div>
              )}

              {gameState.phase === 'setup' && (
                <div className="setup-summary-wrapper">
                  <div className="setup-summary-header">Game Setup: {gameState.setName || 'Random'}</div>
                  <div className="setup-limits-grid">
                    <div className="setup-limit-section">
                      <h4>Total Pawn Pool</h4>
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
                      <h4>Pawn Play Limits</h4>
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
                    Waiting for host to click "DRAW SETS" in the top bar...
                  </div>
                </div>
              )}

            </BoardComponent>
          )}
          <GameHeader 
            counters={counters} 
            maxPool={gameState.sets?.pawns || {}} 
            pawnsInPlayLimit={gameState.sets?.pawnsInPlayLimit}
            playerOrder={gameState.playerOrder} 
            currentPlayerIndex={gameState.currentPlayerIndex} 
            passedPlayers={gameState.passedPlayers} 
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
          />

          {gameState.phase === 'general_phase' && (() => {
            const curId = playerId || gameState.playerOrder[gameState.currentPlayerIndex];
            const player = gameState.players.find(p => p.id !== null && p.id !== undefined && String(p.id) === String(curId));
            const hasGeneral = !!player?.generalOf;
            
            return (
              <div className="generals-pool-wrapper">
                <div className="generals-pool-header">
                  {hasGeneral ? "General Chosen" : "Choose General"}
                </div>
                <div className="generals-pool-horizontal">
                  {gameState.availableGenerals.map(race => (
                    <div 
                      key={race} 
                      className={`general-icon large portrait ${race} ${hasGeneral ? 'disabled' : ''}`} 
                      onMouseDown={(e) => !hasGeneral && handleGeneralMouseDown(race, e)}
                      onClick={() => !hasGeneral && handleSelectGeneral(race)}
                      title={hasGeneral ? "You already have a general" : `Click to choose ${race}`}
                    >
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <div className="right-controls">
          <HistoryPanel logs={gameState.history || []} />
          
          {playerId && (
            <div className="player-hand-section always-visible">
              <div className="player-hand-header">Player {playerId} Hand</div>
              <SetsPanel 
                sets={(gameState.sets?.heldSets || []).filter(s => String(s.ownerId) === String(playerId))}
                onSetMouseDown={handleSetMouseDown}
                hideTabs={true}
                placementPool={placementPool}
              />
            </div>
          )}
        </div>
      </div>
      
      {isScoringPopupOpen && (
        <div className="scoring-modal-overlay" onClick={() => setIsScoringPopupOpen(false)}>
          <div className="scoring-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setIsScoringPopupOpen(false)}>×</button>
            <div className="scoring-rules-container">
              <h2>SCORING RULES</h2>
              <div className="rules-section">
                <h3>Placement Points (Immediate)</h3>
                <p><strong>Vampire:</strong> (4 - distance from Jakub) × count.</p>
                <p><strong>Werewolf:</strong> 1 base point + 1 point for every 3 werewolves (rounding down) in target/neighbor regions. Plus 1 if Jakub is in target or neighbor.</p>
                <p><strong>Ghost:</strong> (2 - distance to edge) per pawn. -1 if in target or neighbor region (distance ≤ 1).</p>
                <p><strong>Bardak:</strong> 1 pt per pawn (0 if distance ≤ 1 from Jakub).</p>
                </div>
              <div className="rules-section">
                <h3>Punkty Świadka Jakuba</h3>
                <p>Generals get <strong>+2 points</strong> for each of their pawns remaining in Jakub's region after he leaves, or after his anger towards all bands falls to 0.</p>
              </div>
                <div className="rules-section">
                <h3>End Game Bonus (Final Round)</h3>
                <p><strong>Vampire:</strong> 2 pts per region containing vampires.</p>
                <p><strong>Werewolf:</strong> 1 pt per pawn on board.</p>
                <p><strong>Ghost:</strong> 2 pts if alone in region; 1 pt if Majority.</p>
                <p><strong>Bardak:</strong> 1 pt if Majority.</p>
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
              <h2>KONIEC GRY: RANKING I STATYSTYKI</h2>
            </div>
            
            {sortedPlayers.length > 0 && (
              <div className="end-game-rankings">
                {/* 1st Place / Winner */}
                {(() => {
                  const winner = sortedPlayers[0];
                  return (
                    <div className="rank-card winner-card">
                      <div className="rank-badge gold">1st</div>
                      <div className="player-details">
                        <h3 className="winner-title">ZWYCIĘZCA: Gracz {winner.id} ({winner.name})</h3>
                        <div className="final-score">{winner.points} pkt</div>
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
                    const rankLabel = idx === 0 ? '2nd' : idx === 1 ? '3rd' : '4th';
                    const rankClass = idx === 0 ? 'silver' : idx === 1 ? 'bronze' : 'fourth';
                    return (
                      <div key={player.id} className={`rank-card runner-card ${rankClass}`}>
                        <div className={`rank-badge ${rankClass}`}>{rankLabel}</div>
                        <div className="player-details">
                          <h4>Gracz {player.id} ({player.name})</h4>
                          <div className="final-score">{player.points} pkt</div>
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
                POWRÓT DO PLANSZY
              </button>
            </div>
          </div>
        </div>
      )}

      {activePawn && <MouseElement type={PAWN_TYPES.find(p => p.id === activePawn.typeId)} x={activePawn.x} y={activePawn.y} />}
      {activeSet && (
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
      {activeGeneral && <div className="general-ghost" style={{ left: activeGeneral.x, top: activeGeneral.y }}><div className={`general-icon large portrait ${activeGeneral.race}`}></div></div>}
      {hoveredPawn && !activePawn && !activeSet && !activeGeneral && <PawnStatusPopup pawn={hoveredPawn.pawn} pawnType={hoveredPawn.pawnType} position={{ x: hoveredPawn.x, y: hoveredPawn.y }} />}
      <Footer />
    </div>
  );
}

export default App;
