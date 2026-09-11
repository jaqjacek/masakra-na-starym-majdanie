import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import '../../assets/css/panels/players.css';

const RobotHeadIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 1.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Zm-.7 3.4h1.4v2.1h-1.4zM6.2 7.2h11.6c1.1 0 2 .9 2 2v9.2c0 1.1-.9 2-2 2H6.2c-1.1 0-2-.9-2-2V9.2c0-1.1.9-2 2-2Zm2.6 4.1a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Zm6.4 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM9 16.7h6v1.5H9z"
    />
  </svg>
);

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 3.2a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2ZM6.1 21.2v-.7c0-3.7 2.5-6.2 5.9-6.2s5.9 2.5 5.9 6.2v.7H6.1Z"
    />
  </svg>
);

const PlayersPanel = ({ 
  players, 
  onUpdatePoints, 
  currentPlayerId, 
  onPlayerMouseUp, 
  onGeneralClick, 
  sets, 
  passedPlayers = [],
  manualPlayers = [],
  onToggleManualPlayer,
  activeTurnPlayerId = null,
  phase = '',
  isMobileUi = false
}) => {
  const { t } = useTranslation();

  const handleMouseDown = (e, index) => {
    if (e.shiftKey) {
      if (e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        onUpdatePoints(index, 1);
      }
    } else if (e.ctrlKey) {
      if (e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        onUpdatePoints(index, 0, true); // Sets to 0
      }
    }
  };

  const handleSelectPlayer = (e, id) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    if (currentPlayerId !== null && currentPlayerId !== undefined && String(currentPlayerId) === String(id)) {
      url.searchParams.delete('player');
    } else {
      url.searchParams.set('player', id);
    }
    window.location.assign(url.toString());
  };

  return (
    <div className="points-tracker">
      {players.map((player, index) => {
        const isMe = currentPlayerId !== null && currentPlayerId !== undefined && String(player.id) === String(currentPlayerId);
        const isPassed = passedPlayers.some(id => String(id) === String(player.id));
        const playingAsSpecific = currentPlayerId !== null && currentPlayerId !== undefined;
        const isOtherPlayer = playingAsSpecific && !isMe;
        const isPlayerTurnPhase = phase === 'player_phase' || phase === 'general_phase';
        const isMyTurn = isMe && isPlayerTurnPhase && activeTurnPlayerId !== null && activeTurnPlayerId !== undefined && String(player.id) === String(activeTurnPlayerId);
        const displayName = `${player.id}:${player.name || ''}`;
        
        // Calculate sets in player's hand
        let ownedSetsCount = 0;
        if (sets) {
          // Check both migration compatibility and new heldSets structure
          const hand = sets.heldSets || sets.items || [];
          ownedSetsCount = hand.filter(s => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(player.id) && !s.used).length;
        }
        
        const isManual = manualPlayers.some(id => String(id) === String(player.id));

        return (
          <div 
            key={player.id} 
            className={`player-point-item ${isMe ? 'me-item' : ''} ${isMyTurn ? 'active-turn' : ''} ${isOtherPlayer ? 'other-player-dim' : ''}`}
            onMouseUp={() => onPlayerMouseUp && onPlayerMouseUp(player.id)}
          >
            <div className="player-cell-top">
              <div className="player-general-container">
                {player.generalOf ? (
                  <div 
                    className={`general-icon ${player.generalOf} clickable`} 
                    onClick={() => onGeneralClick && onGeneralClick(player.id)}
                    title={isMe ? t('resign_general_title') : t('general_of_title', { race: t(player.generalOf) })}
                  ></div>
                ) : (
                  <div className="general-placeholder" title={t('no_general_chosen')}></div>
                )}
              </div>

              <button
                type="button"
                className={`player-ai-toggle ${isManual ? 'is-manual' : 'is-ai'}`}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleManualPlayer && onToggleManualPlayer(player.id);
                }}
                title={t('toggle_manual_ai_tooltip')}
                aria-pressed={!isManual}
              >
                {isManual ? <PersonIcon /> : <RobotHeadIcon />}
              </button>

              <div className="player-points-display">
                {isMobileUi && (
                  <button
                    type="button"
                    className="player-points-btn"
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdatePoints(index, -1);
                    }}
                    aria-label="-1"
                  >
                    −
                  </button>
                )}
                <span 
                  className="player-points interactive" 
                  onMouseDown={(e) => handleMouseDown(e, index)}
                  title={t('points_click_tooltip')}
                >
                  {player.points}
                </span>
                {isMobileUi && (
                  <button
                    type="button"
                    className="player-points-btn"
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdatePoints(index, 1);
                    }}
                    aria-label="+1"
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            <div className="player-cell-bottom">
              <span className="player-id-label">P{player.id}</span>
              <div className="owned-sets-badge" title={t('sets_in_hand_tooltip', { count: ownedSetsCount })}>
                {t('sets_in_hand_count', { count: ownedSetsCount })}
              </div>
              {isPassed && <div className="pass-badge">{t('pass')}</div>}
              <button 
                type="button"
                className="player-switch-btn" 
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => handleSelectPlayer(e, player.id)}
                title={t('switch_to_player_tooltip', { name: displayName })}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3l4 4-4 4M8 21l-4-4 4-4M20 7H4M4 17h16" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayersPanel;
