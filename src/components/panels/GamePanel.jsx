import React from 'react';

const GamePanel = ({ 
  gameId, 
  gameState, 
  totalRounds, 
  isMenuOpen, 
  setIsMenuOpen, 
  isFullAutoplay, 
  setIsFullAutoplay, 
  isJakubAutoplay, 
  setIsJakubAutoplay,
  autoplaySpeed,
  setAutoplaySpeed,
  isSetsPanelOpen,
  setIsSetsPanelOpen,
  isEventsPanelOpen,
  setIsEventsPanelOpen,
  onManualDrawSets,
  onGoToPlayerPhase,
  onExecuteManualTurn,
  onGoToJakubPhase,
  onExecuteEventPhase,
  onOpenScoring,
  onCreateNewGame,
  onChangeGame,
  onAdminPanel,
  onOpenLoadSaves,
  onOpenStats
}) => {
  return (
    <div className="top-header-bar">
      <div className="header-left-group">
        <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <div className="hamburger-icon"><span></span><span></span><span></span></div>
        </button>
        
        <div className="game-id-info">
          ID: <strong>{gameId}</strong> 
          <span className="phase-indicator">{gameState.phase}</span> 
          <span className="round-indicator">R:{gameState.currentRound}/{totalRounds}</span>
        </div>

        <button className="scoring-summary-btn main-panel-btn" onClick={onOpenScoring}>Scoring</button>
        <button className="load-saves-btn main-panel-btn" onClick={onOpenLoadSaves}>Load</button>
        {gameState.phase === 'End Game' && (
          <button className="end-game-stats-btn main-panel-btn" onClick={onOpenStats}>Stats</button>
        )}

        {!isFullAutoplay && !isJakubAutoplay && (
          <div className="manual-phase-controls">
            {gameState.phase === 'setup' && (
              <button className="action-button next-btn" onClick={onManualDrawSets}>DRAW SETS</button>
            )}
            
            {gameState.phase === 'general_phase' && (
              gameState.players.every(p => p.generalOf) ? (
                <button className="action-button next-btn" onClick={onGoToPlayerPhase}>GO TO PLAYER PHASE</button>
              ) : <span className="phase-hint">Waiting for all players...</span>
            )}

            {gameState.phase === 'player_phase' && (
              <>
                {gameState.passedPlayers.length < gameState.players.length ? (() => {
                  const curId = gameState.playerOrder[gameState.currentPlayerIndex];
                  const isPassed = gameState.passedPlayers.some(id => String(id) === String(curId));
                  if (gameState.turnActionExecuted) {
                    return (
                      <button 
                        className="action-button next-btn" 
                        onClick={() => onExecuteManualTurn && onExecuteManualTurn(curId, 'next')}
                      >
                        NEXT
                      </button>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="action-button next-btn" 
                        onClick={() => onExecuteManualTurn && onExecuteManualTurn(curId, 'next')}
                        disabled={isPassed}
                      >
                        NEXT
                      </button>
                      <button 
                        className="action-button pass-btn" 
                        onClick={() => onExecuteManualTurn && onExecuteManualTurn(curId, 'pass')}
                        disabled={isPassed}
                      >
                        PASS
                      </button>
                    </div>
                  );
                })() : (
                  <button className="action-button next-btn jakub-trigger" onClick={onGoToJakubPhase}>GO TO JAKUB PHASE</button>
                )}
              </>
            )}

            {gameState.phase === 'event_phase' && (
              <button className="action-button next-btn event-trigger" onClick={onExecuteEventPhase}>EXECUTE EVENT</button>
            )}
          </div>
        )}
      </div>

      <div className="header-right-group">
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

          <div className="speed-control">
            <span className="speed-label">{autoplaySpeed}ms</span>
            <input type="range" min="50" max="1500" step="50" value={autoplaySpeed} onChange={(e) => setAutoplaySpeed(parseInt(e.target.value))} />
          </div>
        </div>

        <div className="header-actions">
          <button className={`sets-toggle-btn ${isEventsPanelOpen ? 'active' : ''}`} onClick={() => setIsEventsPanelOpen(!isEventsPanelOpen)} style={{ marginRight: '10px' }}>EVENTS</button>
          <button className={`sets-toggle-btn ${isSetsPanelOpen ? 'active' : ''}`} onClick={() => setIsSetsPanelOpen(!isSetsPanelOpen)}>SETS</button>
        </div>
      </div>

      {isMenuOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)}></div>
          <div className="dropdown-menu">
            <button className="menu-item" onClick={() => window.location.href = '/'}>Landing Page</button>
            <button className="menu-item" onClick={onCreateNewGame}>Create New Game</button>
            <button className="menu-item" onClick={onChangeGame}>Change Game</button>
            <button className="menu-item" onClick={onAdminPanel}>Admin Panel</button>
          </div>
        </>
      )}
    </div>
  );
};

export default GamePanel;
