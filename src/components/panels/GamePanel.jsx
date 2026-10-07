import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { WORLD_LANGUAGES } from '../../constants/languages';
import { MIN_AUTOPLAY_SPEED_MS, MAX_AUTOPLAY_SPEED_MS, AUTOPLAY_SPEED_STEP_MS } from '../../constants/constants';
import '../../assets/css/panels/game.css';

const LayoutModePicker = ({ uiLayout, setUiLayout, t }) => (
  <fieldset className="options-layout-group">
    <legend>{t('ui_layout_label', { defaultValue: 'Layout' })}</legend>
    {['auto', 'mobile', 'desktop'].map((mode) => (
      <label key={mode} className="options-checkbox-label">
        <input
          type="radio"
          name="uiLayout"
          value={mode}
          checked={uiLayout === mode}
          onChange={() => setUiLayout && setUiLayout(mode)}
        />
        {t(`ui_layout_${mode}`)}
      </label>
    ))}
  </fieldset>
);

const PhaseControls = ({
  gameState,
  currentPlayerId,
  isFullAutoplay,
  isJakubAutoplay,
  onManualDrawSets,
  onGoToPlayerPhase,
  onExecuteManualTurn,
  onGoToJakubPhase,
  onExecuteEventPhase,
  t
}) => (
  <div className="manual-phase-controls">
    {gameState.phase === 'setup' && !isFullAutoplay && !isJakubAutoplay && (
      <button className="action-button next-btn" onClick={onManualDrawSets}>{t('draw_sets')}</button>
    )}

    {gameState.phase === 'general_phase' && (
      gameState.players.every(p => p.generalOf) ? (
        (!isFullAutoplay && !isJakubAutoplay) && (
          <button className="action-button next-btn" onClick={onGoToPlayerPhase}>{t('go_to_player_phase')}</button>
        )
      ) : (
        (() => {
          const curId = gameState.playerOrder[gameState.currentPlayerIndex];
          const isManual = (gameState.manualPlayers || []).some(id => String(id) === String(curId));
          if (!isManual) {
            return <span className="phase-hint">{t('waiting_for_ai', { player: curId, defaultValue: `AI gracza ${curId}...` })}</span>;
          }
          const isMyTurn = (currentPlayerId === null || currentPlayerId === undefined || String(currentPlayerId) === String(curId));
          return isMyTurn ? <span className="phase-hint">{t('waiting_for_all')}</span> : null;
        })()
      )
    )}

    {gameState.phase === 'player_phase' && (
      <>
        {gameState.passedPlayers.length < gameState.players.length ? (() => {
          const curId = gameState.playerOrder[gameState.currentPlayerIndex];

          if (currentPlayerId !== null && currentPlayerId !== undefined && String(currentPlayerId) !== String(curId)) {
            return <span className="phase-hint">{t('waiting_for_move', { player: curId })}</span>;
          }

          const isPassed = gameState.passedPlayers.some(id => String(id) === String(curId));
          if (isPassed) {
            return <span className="phase-hint">{t('waiting_for_all')}</span>;
          }

          const manualList = gameState.manualPlayers || [];
          const isManual = manualList.some(id => String(id) === String(curId));

          if (!isManual) {
            return <span className="phase-hint">{t('waiting_for_ai', { player: curId, defaultValue: `AI gracza ${curId}...` })}</span>;
          }

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
                title={t('next')}
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
          (!isFullAutoplay && !isJakubAutoplay) && (
            <button className="action-button next-btn jakub-trigger" onClick={onGoToJakubPhase}>{t('go_to_jakub_phase')}</button>
          )
        )}
      </>
    )}

    {gameState.phase === 'event_phase' && !isFullAutoplay && !isJakubAutoplay && (
      <button className="action-button next-btn event-trigger" onClick={onExecuteEventPhase}>{t('execute_event')}</button>
    )}
  </div>
);

const OptionsFields = ({
  gameState,
  updateGameWithSync,
  showTracks,
  setShowTracks,
  showCounters,
  setShowCounters,
  showAnimations,
  setShowAnimations,
  autoClickNext,
  setAutoClickNext,
  miniBoard,
  setMiniBoard,
  uiLayout,
  setUiLayout,
  t
}) => (
  <>
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
      {t('options_mercy_phase', { defaultValue: '😇 Mercy Phase' })}
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
    <label className="options-checkbox-label">
      <input
        type="checkbox"
        checked={autoClickNext}
        onChange={(e) => setAutoClickNext && setAutoClickNext(e.target.checked)}
      />
      {t('options_auto_click_next')}
    </label>
    <label className="options-checkbox-label">
      <input
        type="checkbox"
        checked={miniBoard}
        onChange={(e) => setMiniBoard && setMiniBoard(e.target.checked)}
      />
      {t('options_mini_board')}
    </label>
    <LayoutModePicker uiLayout={uiLayout} setUiLayout={setUiLayout} t={t} />
  </>
);

export function GameTabBody(props) {
  const { t, lang, changeLanguage } = useTranslation();
  const {
    isFullAutoplay, setIsFullAutoplay, isJakubAutoplay, setIsJakubAutoplay,
    autoplaySpeed, setAutoplaySpeed,
    isSetsPanelOpen, setIsSetsPanelOpen,
    isEventsPanelOpen, setIsEventsPanelOpen,
    onOpenScoring, onOpenLoadSaves, onOpenStats,
    onCreateNewGame, onChangeGame, onAdminPanel,
    spectatorLocked, spectatorBusy, canStartSpectator, canReplaySpectator, spectatorError,
    onStartSpectator, onReplaySpectator,
    gameState, children
  } = props;

  return (
    <div className="mobile-game-tab">
      {!spectatorLocked && <PhaseControls {...props} t={t} />}
      {(canStartSpectator || canReplaySpectator) && (
        <button type="button" className="spectator-mode-btn" onClick={canReplaySpectator ? onReplaySpectator : onStartSpectator}>
          {canReplaySpectator ? t('spectator_replay') : t('spectator_watch')}
        </button>
      )}
      {spectatorError && <div className="spectator-error">{spectatorError}</div>}

      {!spectatorLocked && (
      <div className="mobile-game-actions">
        <button type="button" onClick={onOpenScoring}>{t('scoring')}</button>
        <button type="button" onClick={onOpenLoadSaves}>{t('load')}</button>
        {gameState.phase === 'End Game' && (
          <button type="button" onClick={onOpenStats}>{t('stats')}</button>
        )}
        <button
          type="button"
          className={isEventsPanelOpen ? 'active' : ''}
          onClick={() => setIsEventsPanelOpen(!isEventsPanelOpen)}
        >
          {t('events_panel_btn')}
        </button>
        <button
          type="button"
          className={isSetsPanelOpen ? 'active' : ''}
          onClick={() => setIsSetsPanelOpen(!isSetsPanelOpen)}
        >
          {t('sets_panel_btn')}
        </button>
      </div>
      )}

      <div className="autoplay-controls">
        {!spectatorLocked && (
          <>
            <button
              className={`autoplay-btn ${isJakubAutoplay ? 'active' : ''}`}
              onClick={() => { setIsJakubAutoplay(!isJakubAutoplay); setIsFullAutoplay(false); }}
            >
              {isJakubAutoplay ? t('pause_jakub_btn', { defaultValue: 'PAUSE J' }) : t('jakub_auto_btn', { defaultValue: 'JAKUB AUTO' })}
            </button>
            <button
              className={`autoplay-btn full ${isFullAutoplay ? 'active' : ''}`}
              onClick={() => { setIsFullAutoplay(!isFullAutoplay); setIsJakubAutoplay(false); }}
            >
              {isFullAutoplay ? t('pause_full_btn', { defaultValue: 'PAUSE FULL' }) : t('full_auto_btn', { defaultValue: 'FULL AUTO' })}
            </button>
          </>
        )}
        {spectatorBusy && <span className="speed-label">{t('spectator_recording')}</span>}
        <div className="speed-control">
          <span className="speed-label">{autoplaySpeed}ms</span>
          <input type="range" min={MIN_AUTOPLAY_SPEED_MS} max={MAX_AUTOPLAY_SPEED_MS} step={AUTOPLAY_SPEED_STEP_MS} value={autoplaySpeed} onChange={(e) => setAutoplaySpeed(parseInt(e.target.value, 10))} />
        </div>
      </div>

      {!spectatorLocked && <OptionsFields {...props} t={t} />}

      {children}

      {!spectatorLocked && (
      <div className="mobile-game-nav">
        <button type="button" onClick={() => { window.location.href = '/'; }}>{t('landing_page_btn')}</button>
        <button type="button" onClick={onCreateNewGame}>{t('create_new_game')}</button>
        <button type="button" onClick={onChangeGame}>{t('change_game_btn')}</button>
        <button type="button" onClick={onAdminPanel}>{t('admin_panel')}</button>
      </div>
      )}

      {!spectatorLocked && (
      <div className="mobile-game-langs" role="group" aria-label={t('choose_language')}>
        {WORLD_LANGUAGES.map((item) => (
          <button
            key={item.code}
            type="button"
            className={`lang-icon-btn${lang === item.code ? ' active' : ''}`}
            onClick={() => changeLanguage(item.code)}
            title={item.name}
            aria-label={item.name}
            aria-pressed={lang === item.code}
          >
            <span className="lang-icon-flag" aria-hidden="true">{item.flag}</span>
          </button>
        ))}
      </div>
      )}
    </div>
  );
}

const GamePanel = ({
  gameId,
  gameState,
  updateGameWithSync,
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
  spectatorLocked = false,
  spectatorBusy = false,
  canStartSpectator = false,
  canReplaySpectator = false,
  spectatorError = '',
  onStartSpectator,
  onReplaySpectator,
  currentPlayerId,
  showTracks = true,
  setShowTracks,
  showCounters = true,
  setShowCounters,
  showAnimations = true,
  setShowAnimations,
  autoClickNext = true,
  setAutoClickNext,
  miniBoard = false,
  setMiniBoard,
  isMobileUi = false,
  uiLayout = 'auto',
  setUiLayout,
  onOpenMobileGameTab
}) => {
  const { t } = useTranslation();
  const [isOptionsOpen, setIsOptionsOpen] = React.useState(false);

  const optionProps = {
    gameState,
    updateGameWithSync,
    showTracks,
    setShowTracks,
    showCounters,
    setShowCounters,
    showAnimations,
    setShowAnimations,
    autoClickNext,
    setAutoClickNext,
    miniBoard,
    setMiniBoard,
    uiLayout,
    setUiLayout,
    t
  };

  const phaseProps = {
    gameState,
    currentPlayerId,
    isFullAutoplay,
    isJakubAutoplay,
    onManualDrawSets,
    onGoToPlayerPhase,
    onExecuteManualTurn,
    onGoToJakubPhase,
    onExecuteEventPhase,
    t
  };

  const handleMenuToggle = () => {
    if (isMobileUi && onOpenMobileGameTab) {
      onOpenMobileGameTab();
      return;
    }
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="top-header-bar">
      <div className="header-left-group">
        {!spectatorLocked && (
          <button className="menu-toggle-btn" onClick={handleMenuToggle} aria-label={t('options_button')}>
            <div className="hamburger-icon"><span></span><span></span><span></span></div>
          </button>
        )}

        <div className="game-id-info">
          ID: <strong>{gameId}</strong>
          <span className="phase-indicator">{t(`phase_${gameState.phase}`, { defaultValue: gameState.phase })}</span>
        </div>

        {!spectatorLocked && (
          <>
            <button className="scoring-summary-btn main-panel-btn" onClick={onOpenScoring}>{t('scoring')}</button>
            <button className="load-saves-btn main-panel-btn" onClick={onOpenLoadSaves}>{t('load')}</button>
            {gameState.phase === 'End Game' && (
              <button className="end-game-stats-btn main-panel-btn" onClick={onOpenStats}>{t('stats')}</button>
            )}
            <PhaseControls {...phaseProps} />
          </>
        )}
        {(canStartSpectator || canReplaySpectator) && (
          <button type="button" className="spectator-mode-btn" onClick={canReplaySpectator ? onReplaySpectator : onStartSpectator}>
            {canReplaySpectator ? t('spectator_replay') : t('spectator_watch')}
          </button>
        )}
        {spectatorError && <span className="spectator-error">{spectatorError}</span>}
      </div>

      <div className="header-right-group">
        <div className="autoplay-controls">
          {!spectatorLocked && (
            <>
              <button
                className={`autoplay-btn ${isJakubAutoplay ? 'active' : ''}`}
                onClick={() => { setIsJakubAutoplay(!isJakubAutoplay); setIsFullAutoplay(false); }}
                title="Automate only Jakub's phase"
              >
                {isJakubAutoplay ? t('pause_jakub_btn', { defaultValue: 'PAUSE J' }) : t('jakub_auto_btn', { defaultValue: 'JAKUB AUTO' })}
              </button>

              <button
                className={`autoplay-btn full ${isFullAutoplay ? 'active' : ''}`}
                onClick={() => { setIsFullAutoplay(!isFullAutoplay); setIsJakubAutoplay(false); }}
                title="Automate everything"
              >
                {isFullAutoplay ? t('pause_full_btn', { defaultValue: 'PAUSE FULL' }) : t('full_auto_btn', { defaultValue: 'FULL AUTO' })}
              </button>
            </>
          )}
          {spectatorBusy && <span className="speed-label">{t('spectator_recording')}</span>}

          <div className="speed-control">
            <span className="speed-label">{autoplaySpeed}ms</span>
            <input type="range" min={MIN_AUTOPLAY_SPEED_MS} max={MAX_AUTOPLAY_SPEED_MS} step={AUTOPLAY_SPEED_STEP_MS} value={autoplaySpeed} onChange={(e) => setAutoplaySpeed(parseInt(e.target.value, 10))} />
          </div>
        </div>

        {!spectatorLocked && (
        <div className="header-actions">
          <button className={`sets-toggle-btn options-toggle-btn ${isOptionsOpen ? 'active' : ''}`} onClick={() => setIsOptionsOpen(!isOptionsOpen)} style={{ marginRight: '10px' }}>{t('options_button')}</button>
          <button className={`sets-toggle-btn ${isEventsPanelOpen ? 'active' : ''}`} onClick={() => setIsEventsPanelOpen(!isEventsPanelOpen)} style={{ marginRight: '10px' }}>{t('events_panel_btn')}</button>
          <button className={`sets-toggle-btn ${isSetsPanelOpen ? 'active' : ''}`} onClick={() => setIsSetsPanelOpen(!isSetsPanelOpen)}>{t('sets_panel_btn')}</button>
        </div>
        )}
      </div>

      {isMenuOpen && !isMobileUi && !spectatorLocked && (
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

      {isOptionsOpen && !isMobileUi && !spectatorLocked && (
        <>
          <div className="menu-backdrop" onClick={() => setIsOptionsOpen(false)}></div>
          <div className="options-dropdown-menu">
            <OptionsFields {...optionProps} />
          </div>
        </>
      )}
    </div>
  );
};

export default GamePanel;
