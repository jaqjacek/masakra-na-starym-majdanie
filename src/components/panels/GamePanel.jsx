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
  playerId,
  onManualDrawSets,
  onGoToPlayerPhase,
  onPass,
  onGoToJakubPhase,
  onOpenScoring,
  onCreateNewGame,
  onChangeGame,
  onAdminPanel
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
                {gameState.passedPlayers.length < gameState.players.length ? (
                  <button 
                    className="action-button pass-btn" 
                    onClick={onPass}
                    disabled={gameState.passedPlayers.includes(playerId || gameState.playerOrder[gameState.currentPlayerIndex])}
                  >
                    PASS
                  </button>
                ) : (
                  <button className="action-button next-btn jakub-trigger" onClick={onGoToJakubPhase}>GO TO JAKUB PHASE</button>
                )}
              </>
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
            <input type="range" min="100" max="1500" step="50" value={autoplaySpeed} onChange={(e) => setAutoplaySpeed(parseInt(e.target.value))} />
          </div>
        </div>

        <div className="header-actions">
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
