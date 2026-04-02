import React, { useState, useCallback, useMemo } from 'react';
import './assets/css/base.css';
import './assets/css/game.css';

// Components
import BoardComponent from './components/Board';
import Bag from './components/Bag';
import PawnGhost from './components/PawnGhost';
import LandingPage from './components/LandingPage';
import GameHeader from './components/GameHeader';
import JakubPanel from './components/JakubPanel';
import SetsPanel from './components/SetsPanel';
import PointsTracker from './components/PointsTracker';
import AdminSets from './components/AdminSets';
import AdminSimulate from './components/AdminSimulate';
import AdminNav from './components/AdminNav';
import HistoryPanel from './components/HistoryPanel';
import PawnStatusPopup from './components/PawnStatusPopup';
import Footer from './components/Footer';

// Hooks
import { useGameState } from './hooks/useGameState';
import { useAutoplay } from './hooks/useAutoplay';
import { useGameInteraction } from './hooks/useGameInteraction';

// Constants & Utilities
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from './constants/pawnTypes';
import { RACES, INITIAL_STATE } from './constants/game';
import { TOTAL_GAME_ROUNDS, INITIAL_HAND_SIZE, JAKUB_INITIAL_SETS, SERVER_URL } from './constants/constants';
import { resetMap } from './services/api';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSetsPanelOpen, setIsSetsPanelOpen] = useState(false);

  // 1. Basic state and sync
  const isAdminPath = useMemo(() => window.location.pathname.startsWith('/admin'), []);
  const {
    gameId, setGameId, playerId, gameState, setGameState, currentPath, updateGameWithSync, addLog
  } = useGameState(isAdminPath);

  // 2. Computed values
  const counters = useMemo(() => {
    const breakdown = PAWN_TYPES.reduce((acc, pawn) => { acc[pawn.id] = 0; return acc; }, {});
    let total = 0;
    if (gameState.regions) {
      gameState.regions.forEach(region => {
        Object.entries(region.pawns).forEach(([typeId, instances]) => {
          if (breakdown[typeId] !== undefined && Array.isArray(instances)) {
            breakdown[typeId] += instances.length; total += instances.length;
          }
        });
      });
    }
    return { total, breakdown };
  }, [gameState.regions]);

  const availablePool = useMemo(() => {
    if (!gameState.sets || !gameState.sets.pawns) return {};
    const pool = { ...gameState.sets.pawns };
    Object.keys(pool).forEach(race => { pool[race] = Math.max(0, pool[race] - (counters.breakdown[race] || 0)); });
    return pool;
  }, [gameState.sets, counters.breakdown]);

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
  } = useAutoplay({ gameId, gameState, updateGameWithSync, addLog, jakubRegion });

  // 4. Interaction logic
  const {
    activePawn, activeSet, activeGeneral, hoveredPawn, setHoveredPawn, validMoveTargets,
    handleBagMouseDown, handleJakubMouseDownFromPanel, handleSetMouseDown, handleGeneralMouseDown,
    handlePawnMouseDown, handleRegionMouseUp, handlePlayerMouseUp, handleJakubMouseUp
  } = useGameInteraction({
    gameId, playerId, gameState, availablePool, counters, isJakubOnBoard, jakubRegion, updateGameWithSync, addLog, findAndRemoveSetById
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

  const handleResetBoard = useCallback(async () => {
    if (gameId && window.confirm('Reset game?')) {
      try { const serverData = await resetMap(gameId); if (serverData) setGameState(serverData); setIsMenuOpen(false); } catch (err) { alert('Reset failed'); }
    }
  }, [gameId, setGameState]);

  const handleManualDrawSets = useCallback(() => {
    const workState = JSON.parse(JSON.stringify(gameState));
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
      const myHeld = (workState.sets.heldSets || []).filter(s => s.ownerId === player.id);
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
    if (distributionCount > 0) addLog(workState, `Round ${workState.currentRound}: Refilled player hands.`);
    for (let i = 0; i < JAKUB_INITIAL_SETS; i++) {
      const set = draw(workState);
      if (set) {
        set.ownerId = 'jakub';
        if (!workState.sets.heldSets) workState.sets.heldSets = [];
        workState.sets.heldSets.push(set);
        addLog(workState, `Jakub claimed Set ${set.id} from pool.`);
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

  const handlePass = useCallback(() => {
    const workState = JSON.parse(JSON.stringify(gameState));
    const curId = playerId || workState.playerOrder[workState.currentPlayerIndex];
    if (!workState.passedPlayers.includes(curId)) {
      workState.passedPlayers.push(curId);
      addLog(workState, `Player ${curId} passed.`);
      
      // If playing in order, advance index to next non-passed player if possible
      if (!playerId) {
        workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
      }
      
      updateGameWithSync(workState);
    }
  }, [gameState, playerId, addLog, updateGameWithSync]);

  const handleGoToJakubPhase = useCallback(async () => {
    const workState = JSON.parse(JSON.stringify(gameState));
    workState.phase = 'jakub_phase';
    workState.jakubAngerIncreased = false;
    addLog(workState, `--- Jakub's Rampage Begins ---`);
    updateGameWithSync(workState);
    setIsJakubAutoplay(true); // Automatically run ONLY the Jakub phase
  }, [gameState, addLog, updateGameWithSync, setIsJakubAutoplay]);

  const handleSelectGeneral = useCallback((race) => {
    const workState = JSON.parse(JSON.stringify(gameState));
    // If we have a playerId in URL, we assign specifically to that player
    const targetId = playerId || workState.playerOrder[workState.currentPlayerIndex];
    const playerIdx = workState.players.findIndex(p => p.id === targetId);
    
    if (playerIdx !== -1) {
      const player = workState.players[playerIdx];
      if (player.generalOf) return; // Already has one

      player.generalOf = race;
      workState.availableGenerals = workState.availableGenerals.filter(r => r !== race);
      addLog(workState, `Player ${player.id} chose General of ${race}s`);
      
      // Advance turn ONLY if we are following the natural order (no specific playerId in URL)
      // or if the person whose turn it was just picked.
      if (!playerId || playerId === workState.playerOrder[workState.currentPlayerIndex]) {
        workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
      }
      
      updateGameWithSync(workState);
    }
  }, [gameState, updateGameWithSync, addLog, playerId]);

  const handleDeselectGeneral = useCallback((targetPlayerId) => {
    const workState = JSON.parse(JSON.stringify(gameState));
    const playerIdx = workState.players.findIndex(p => p.id === targetPlayerId);
    
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
  const filteredSets = gameState.sets ? (playerId ? (gameState.sets.heldSets || []).filter(s => s.ownerId === playerId) : (gameState.sets.drawPile || [])) : [];
  const jakubsSets = gameState.sets ? (gameState.sets.heldSets || []).filter(s => s.ownerId === 'jakub') : [];

  // 7. Render logic
  if (currentPath === '/admin/sets') return <div className="app-container"><AdminNav currentPath={currentPath} /><AdminSets /></div>;
  if (currentPath === '/admin/simulate') return <div className="app-container"><AdminNav currentPath={currentPath} /><AdminSimulate /></div>;
  if (isAdminPath) return <div className="app-container"><AdminNav currentPath={currentPath} /><div className="admin-page-content"><p>Please select an Admin section.</p></div></div>;
  if (!gameId) return <LandingPage onGoToGame={(id) => { if (id) window.location.href = `/game/${id}`; }} />;

  return (
    <div className="app-container">
      <div className="top-header-bar">
        <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}><div className="hamburger-icon"><span></span><span></span><span></span></div></button>
        <div className="game-id-info">Game ID: <strong>{gameId}</strong> <span className="phase-indicator">{gameState.phase}</span> <span className="round-indicator">R:{gameState.currentRound}/{TOTAL_GAME_ROUNDS}</span></div>
        {!isFullAutoplay && !isJakubAutoplay && (
          <div className="manual-phase-controls">
            {gameState.phase === 'setup' && (
              <button className="action-button next-btn" onClick={handleManualDrawSets}>DRAW SETS</button>
            )}
            
            {gameState.phase === 'general_phase' && (
              gameState.players.every(p => p.generalOf) ? (
                <button className="action-button next-btn" onClick={handleGoToPlayerPhase}>GO TO PLAYER PHASE</button>
              ) : <span className="phase-hint">Waiting for all players to choose generals...</span>
            )}

            {gameState.phase === 'player_phase' && (
              <>
                {gameState.passedPlayers.length < gameState.players.length ? (
                  <button 
                    className="action-button pass-btn" 
                    onClick={handlePass}
                    disabled={gameState.passedPlayers.includes(playerId || gameState.playerOrder[gameState.currentPlayerIndex])}
                  >
                    PASS
                  </button>
                ) : (
                  <button className="action-button next-btn jakub-trigger" onClick={handleGoToJakubPhase}>GO TO JAKUB PHASE</button>
                )}
              </>
            )}
          </div>
        )}
        <div className="autoplay-controls">
          <button 
            className={`autoplay-btn ${isJakubAutoplay ? 'active' : ''}`} 
            onClick={() => { setIsJakubAutoplay(!isJakubAutoplay); setIsFullAutoplay(false); }}
            title="Automate only Jakub's phase"
          >
            {isJakubAutoplay ? 'PAUSE J' : 'JAKUB AUTO'}
          </button>
          
          <button 
            className={`autoplay-btn full ${isFullAutoplay ? 'active' : ''}`} 
            onClick={() => { setIsFullAutoplay(!isFullAutoplay); setIsJakubAutoplay(false); }}
            title="Automate everything"
          >
            {isFullAutoplay ? 'PAUSE FULL' : 'FULL AUTO'}
          </button>

          <div className="speed-control"><span className="speed-label">{autoplaySpeed}ms</span><input type="range" min="100" max="1500" step="50" value={autoplaySpeed} onChange={(e) => setAutoplaySpeed(parseInt(e.target.value))} /></div>
        </div>
        <div className="header-actions"><button className={`sets-toggle-btn ${isSetsPanelOpen ? 'active' : ''}`} onClick={() => setIsSetsPanelOpen(!isSetsPanelOpen)}>SETS</button></div>
        {isMenuOpen && (
          <><div className="menu-backdrop" onClick={() => setIsMenuOpen(false)}></div><div className="dropdown-menu">
            <button className="menu-item" onClick={async () => {
              try {
                const res = await fetch(`${SERVER_URL}/api/next-game-id`);
                const data = await res.json();
                if (data.id) window.location.href = `/game/${data.id}`;
              } catch (err) { alert('Failed to get new game ID'); }
            }}>Create New Game</button>
            <button className="menu-item reset" onClick={handleResetBoard}>Reset Current Game</button>
            <button className="menu-item" onClick={() => { window.history.pushState({}, '', '/'); setGameId(null); setGameState(INITIAL_STATE); window.dispatchEvent(new Event('popstate')); }}>Change Game</button>
            <button className="menu-item" onClick={() => { window.history.pushState({}, '', '/admin/sets'); window.dispatchEvent(new Event('popstate')); }}>Admin Panel</button>
          </div></>
        )}
      </div>

      <div className="game-layout-wrapper">
        <div className="left-controls">
          <div className="bags-container">{PAWN_TYPES.filter(p => !p.isUnique).map(pawn => (<Bag key={pawn.id} type={pawn} onMouseDown={(e) => handleBagMouseDown(pawn.id, e)} availableCount={availablePool[pawn.id]} />))}</div>
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
          <GameHeader counters={counters} maxPool={gameState.sets?.pawns || {}} />
          <PointsTracker 
            players={gameState.players || []} 
            onUpdatePoints={handleUpdatePoints} 
            currentPlayerId={playerId} 
            onPlayerMouseUp={handlePlayerMouseUp} 
            onGeneralClick={handleDeselectGeneral}
            sets={gameState.sets} 
            passedPlayers={gameState.passedPlayers || []}
          />
          {gameState.phase === 'general_phase' && (() => {
            const curId = playerId || gameState.playerOrder[gameState.currentPlayerIndex];
            const player = gameState.players.find(p => p.id === curId);
            const hasGeneral = !!player?.generalOf;
            
            return (
              <div className="generals-pool-wrapper">
                <div className="generals-pool-header">{hasGeneral ? "General Chosen" : "Choose General"}</div>
                <div className="generals-pool-horizontal">
                  {gameState.availableGenerals.map(race => (
                    <div 
                      key={race} 
                      className={`general-icon large ${race} ${hasGeneral ? 'disabled' : ''}`} 
                      onMouseDown={(e) => !hasGeneral && handleGeneralMouseDown(race, e)}
                      onClick={() => !hasGeneral && handleSelectGeneral(race)}
                      title={hasGeneral ? "You already have a general" : `Click to choose ${race}`}
                    ></div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <div className="right-controls">
          {isSetsPanelOpen && (
            <div className="sidebar-sets-container">
              <SetsPanel 
                sets={gameState.sets?.drawPile || []} 
                discardedSets={gameState.sets?.discardPile || []}
                onSetMouseDown={handleSetMouseDown} 
                title="Draw Pile" 
                setInfo={gameState.sets} 
                discardPileCount={gameState.sets?.discardPile?.length || 0} 
              />
            </div>
          )}
          
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

      <div className="bottom-history-container"><HistoryPanel logs={gameState.history || []} /></div>
      
      {activePawn && <PawnGhost type={PAWN_TYPES.find(p => p.id === activePawn.typeId)} x={activePawn.x} y={activePawn.y} />}
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
      {activeGeneral && <div className="general-ghost" style={{ left: activeGeneral.x, top: activeGeneral.y }}><div className={`general-icon large ${activeGeneral.race}`}></div></div>}
      {hoveredPawn && !activePawn && !activeSet && !activeGeneral && <PawnStatusPopup pawn={hoveredPawn.pawn} pawnType={hoveredPawn.pawnType} position={{ x: hoveredPawn.x, y: hoveredPawn.y }} />}
      <Footer />
    </div>
  );
}

export default App;
