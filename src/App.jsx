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
import AdminNav from './components/AdminNav';
import GameRulesPage from './components/docs/GameRulesPage';
import HistoryPanel from './components/panels/HistoryPanel';
import GamePanel from './components/panels/GamePanel';
import EventsPanel from './components/panels/EventsPanel';
import PawnStatusPopup from './components/PawnStatusPopup';
import Footer from './components/Footer';

// Hooks
import { useGameState } from './hooks/useGameState';
import { useAutoplay } from './hooks/useAutoplay';
import { useGameInteraction } from './hooks/useGameInteraction';

// Constants & Utilities
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from './constants/pawnTypes';
import { RACES, INITIAL_STATE } from './constants/game';
import { applySetToJakubAnger } from './strategies/jakubStrategy';
import { GeneralSelectionManager } from '../shared/generalSelectionManager.js';
import { TOTAL_GAME_ROUNDS, INITIAL_HAND_SIZE, JAKUB_INITIAL_SETS, SERVER_URL, MAX_HAND_SIZE } from './constants/constants';
import { PlacementManager } from './logic/placementManager';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSetsPanelOpen, setIsSetsPanelOpen] = useState(false);
  const [isEventsPanelOpen, setIsEventsPanelOpen] = useState(false);
  const [isScoringPopupOpen, setIsScoringPopupOpen] = useState(false);
  const [manualPlayers, setManualPlayers] = useState([]);

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
    autoplaySpeed, setAutoplaySpeed, findAndRemoveSetById
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
        addLog(workState, `Player ${playerId} chose General of ${pick}s`);
      }

      const best = PlacementManager.findBestPlacement(workState.regions, workState.sets.heldSets, playerId, curPlayer.generalOf, globalPool, playLimits);
      if (best) {
        const { logSummaryString, statusLogString } = PlacementManager.executePlacement(best, workState, PAWN_TYPES, playLimits);
        addLog(workState, `Player ${playerId} placed Set ${best.set.id} [${logSummaryString}] | Board: ${statusLogString}`);
      } else {
        const excess = PlacementManager.executePass(curPlayer, workState, MAX_HAND_SIZE, applySetToJakubAnger);
        if (excess > 0) {
          addLog(workState, `Player ${playerId} passed and sold ${excess} excess set(s). Jakub Anger updated.`, { race: curPlayer.generalOf, points: excess });
        } else {
          addLog(workState, `Player ${playerId} passed.`);
        }
      }
      advanceTurn(workState);
    } else if (action === 'pass') {
      const excess = PlacementManager.executePass(curPlayer, workState, MAX_HAND_SIZE, applySetToJakubAnger);
      if (excess > 0) {
        addLog(workState, `Player ${playerId} passed and sold ${excess} excess set(s). Jakub Anger updated.`, { race: curPlayer.generalOf, points: excess });
      } else {
        addLog(workState, `Player ${playerId} passed.`);
      }
      advanceTurn(workState);
    }

    if (workState.passedPlayers.length === workState.players.length) {
      workState.phase = 'jakub_phase';
      addLog(workState, `--- Start of Jakub Phase ---`);
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
    gameId, playerId, gameState, availablePool, placementPool, counters, isJakubOnBoard, updateGameWithSync, addLog, findAndRemoveSetById, advanceTurn
  });

  // 5. Specific handlers
  const handleUpdatePoints = useCallback((playerIndex, delta) => {
    const newState = JSON.parse(JSON.stringify(gameState));
    newState.players[playerIndex].points = Math.max(0, newState.players[playerIndex].points + delta);
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

  const handleJakubCounterUpdate = useCallback((path, delta) => {
    const newState = JSON.parse(JSON.stringify(gameState));
    let target = null;
    for (const r of newState.regions) { if (r.pawns.jakub?.length > 0) { target = r.pawns.jakub[0]; break; } }
    if (!target) return;
    let curr = target; for (let i = 0; i < path.length - 1; i++) curr = curr[path[i]];
    curr[path[path.length - 1]] = Math.max(0, curr[path[path.length - 1]] + delta);
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
        addLog(state, "Reshuffling discard pile into draw pile.");
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
    if (distributionCount > 0) addLog(workState, `Round ${workState.currentRound}: Refilled player hands to ${INITIAL_HAND_SIZE}.`);
    
    // Find Jakub to update his stats
    let jakubRegionObj = workState.regions.find(r => r.pawns.jakub?.length > 0);
    let jakub = jakubRegionObj ? jakubRegionObj.pawns.jakub[0] : null;

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
          addLog(workState, `Jakub claimed Set ${set.id}. Anger/Range updated immediately.`);
        } else {
          addLog(workState, `Jakub claimed Set ${set.id} from pool.`);
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
    addLog(workState, `--- Start of Player Phase (Round ${workState.currentRound}) ---`);
    updateGameWithSync(workState);
  }, [gameState, addLog, updateGameWithSync]);

  const handleGoToJakubPhase = useCallback(async () => {
    const workState = JSON.parse(JSON.stringify(gameState));
    workState.phase = 'jakub_phase';
    workState.jakubAngerIncreased = false;
    addLog(workState, `--- Jakub's Rampage Begins ---`);
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
      addLog(workState, `Player ${player.id} chose General of ${race}s`);
      
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
      addLog(workState, `Player ${targetPlayerId} resigned from being General of ${race}s`);
      updateGameWithSync(workState);
    }
  }, [gameState, updateGameWithSync, addLog]);

  // 6. Filtering
  const jakubsSets = gameState.sets ? (gameState.sets.heldSets || []).filter(s => s.ownerId === 'jakub') : [];

  // 7. Render logic
  if (currentPath === '/docs/game') return <GameRulesPage />;
  if (currentPath === '/admin/sets') return <div className="app-container"><AdminNav currentPath={currentPath} /><AdminSets /></div>;
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
            />
          </div>
        </div>
        <div className="main-game-area">
          {gameState.regions && <BoardComponent regions={gameState.regions} onRegionMouseUp={handleRegionMouseUp} onRemovePawn={handleRegionRemove} onAddPawn={handleRegionAdd} onPawnMouseDown={handlePawnMouseDown} setHoveredPawn={setHoveredPawn} validMoveTargets={validMoveTargets} />}
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
                sets={(gameState.sets?.heldSets || []).filter(s => s.ownerId === playerId)}
                onSetMouseDown={handleSetMouseDown}
                hideTabs={true}
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
                <p><strong>Werewolf:</strong> floor(total pack / 3) + 1. Plus 1 if Jakub is in target or neighbor.</p>
                <p><strong>Ghost:</strong> (2 - distance to edge) per pawn. -1 if in Jakub's reach.</p>
                <p><strong>Bardak:</strong> 1 pt per pawn (0 if distance ≤ 1 from Jakub).</p>
                </div>
                <div className="rules-section">
                <h3>Rambo Survivor Bonus</h3>
                <p>Generals get <strong>+2 points</strong> for each of their pawns remaining in Jakub's region after his rampage.</p>
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
        </div>
      )}
      {activeGeneral && <div className="general-ghost" style={{ left: activeGeneral.x, top: activeGeneral.y }}><div className={`general-icon large portrait ${activeGeneral.race}`}></div></div>}
      {hoveredPawn && !activePawn && !activeSet && !activeGeneral && <PawnStatusPopup pawn={hoveredPawn.pawn} pawnType={hoveredPawn.pawnType} position={{ x: hoveredPawn.x, y: hoveredPawn.y }} />}
      <Footer />
    </div>
  );
}

export default App;
