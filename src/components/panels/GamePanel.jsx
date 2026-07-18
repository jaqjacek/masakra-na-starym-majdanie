import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const GamePanel = ({ 
  gameId, 
  gameState, 
  updateGameWithSync,
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
  onOpenStats,
  currentPlayerId,
  showTracks = true,
  setShowTracks,
  showCounters = true,
  setShowCounters,
  showAnimations = true,
  setShowAnimations
}) => {
  const { t } = useTranslation();
  const [isOptionsOpen, setIsOptionsOpen] = React.useState(false);

  return (
    <div className="top-header-bar">
      <div className="header-left-group">
        <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <div className="hamburger-icon"><span></span><span></span><span></span></div>
        </button>
        
        <div className="game-id-info">
          ID: <strong>{gameId}</strong> 
          <span className="phase-indicator">{gameState.phase}</span>
        </div>

        <button className="scoring-summary-btn main-panel-btn" onClick={onOpenScoring}>{t('scoring')}</button>
        <button className="load-saves-btn main-panel-btn" onClick={onOpenLoadSaves}>{t('load')}</button>
        {gameState.phase === 'End Game' && (
          <button className="end-game-stats-btn main-panel-btn" onClick={onOpenStats}>{t('stats')}</button>
        )}

        {!isFullAutoplay && !isJakubAutoplay && (
          <div className="manual-phase-controls">
            {gameState.phase === 'setup' && (
              <button className="action-button next-btn" onClick={onManualDrawSets}>{t('draw_sets')}</button>
            )}
            
            {gameState.phase === 'general_phase' && (
              gameState.players.every(p => p.generalOf) ? (
                <button className="action-button next-btn" onClick={onGoToPlayerPhase}>{t('go_to_player_phase')}</button>
              ) : <span className="phase-hint">{t('waiting_for_all')}</span>
            )}

            {gameState.phase === 'player_phase' && (
              <>
                {gameState.passedPlayers.length < gameState.players.length ? (() => {
                  const curId = gameState.playerOrder[gameState.currentPlayerIndex];
                  
                  // If we have a local player ID and it's not our turn, we wait
                  if (currentPlayerId !== null && currentPlayerId !== undefined && String(currentPlayerId) !== String(curId)) {
                    return <span className="phase-hint">{t('waiting_for_move', { player: curId })}</span>;
                  }
                  
                  const isPassed = gameState.passedPlayers.some(id => String(id) === String(curId));
                  if (gameState.turnActionExecuted) {
                    return (
                      <button 
                        className="action-button next-btn" 
                        onClick={() => onExecuteManualTurn && onExecuteManualTurn(curId, 'next')}
                      >
                        {t('next')}
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
                        {t('next')}
                      </button>
                      <button 
                        className="action-button pass-btn" 
                        onClick={() => onExecuteManualTurn && onExecuteManualTurn(curId, 'pass')}
                        disabled={isPassed}
                      >
                        {t('pass')}
                      </button>
                    </div>
                  );
                })() : (
                  <button className="action-button next-btn jakub-trigger" onClick={onGoToJakubPhase}>{t('go_to_jakub_phase')}</button>
                )}
              </>
            )}

            {gameState.phase === 'event_phase' && (
              <button className="action-button next-btn event-trigger" onClick={onExecuteEventPhase}>{t('execute_event')}</button>
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
          <button className={`sets-toggle-btn options-toggle-btn ${isOptionsOpen ? 'active' : ''}`} onClick={() => setIsOptionsOpen(!isOptionsOpen)} style={{ marginRight: '10px' }}>{t('options_button')}</button>
          <button className={`sets-toggle-btn ${isEventsPanelOpen ? 'active' : ''}`} onClick={() => setIsEventsPanelOpen(!isEventsPanelOpen)} style={{ marginRight: '10px' }}>{t('events_panel_btn')}</button>
          <button className={`sets-toggle-btn ${isSetsPanelOpen ? 'active' : ''}`} onClick={() => setIsSetsPanelOpen(!isSetsPanelOpen)}>{t('sets_panel_btn')}</button>
        </div>
      </div>

      {isMenuOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)}></div>
          <div className="dropdown-menu">
            <button className="menu-item" onClick={() => window.location.href = '/'}>{t('landing_page_btn')}</button>
            <button className="menu-item" onClick={onCreateNewGame}>{t('create_new_game')}</button>
            <button className="menu-item" onClick={onChangeGame}>{t('change_game_btn')}</button>
            <button className="menu-item" onClick={onAdminPanel}>{t('admin_panel')}</button>
          </div>
        </>
      )}

      {isOptionsOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setIsOptionsOpen(false)}></div>
          <div className="options-dropdown-menu">
            <label className="options-checkbox-label" style={{ borderBottom: '1px solid #444', paddingBottom: '6px', marginBottom: '6px' }}>
              <input 
                type="checkbox" 
                checked={gameState.mercyActive !== false} 
                onChange={async (e) => {
                  const workState = JSON.parse(JSON.stringify(gameState));
                  workState.mercyActive = e.target.checked;
                  if (updateGameWithSync) {
                    await updateGameWithSync(workState);
                  }
                }} 
              />
              😇 Faza Miłosierdzia
            </label>
            <label className="options-checkbox-label">
              <input 
                type="checkbox" 
                checked={showTracks} 
                onChange={(e) => setShowTracks(e.target.checked)} 
              />
              {t('options_show_tracks')}
            </label>
            <label className="options-checkbox-label">
              <input 
                type="checkbox" 
                checked={showCounters} 
                onChange={(e) => setShowCounters(e.target.checked)} 
              />
              {t('options_show_counters')}
            </label>
            <label className="options-checkbox-label">
              <input 
                type="checkbox" 
                checked={showAnimations} 
                onChange={(e) => setShowAnimations(e.target.checked)} 
              />
              {t('options_show_animations')}
            </label>
          </div>
        </>
      )}
    </div>
  );
};

export default GamePanel;
