import React from 'react';

const PlayersPanel = ({ 
  players, 
  onUpdatePoints, 
  currentPlayerId, 
  onPlayerMouseUp, 
  onGeneralClick, 
  sets, 
  passedPlayers = [],
  manualPlayers = [],
  onToggleManualPlayer
}) => {
  const handleClick = (e, index) => {
    if (e.shiftKey) onUpdatePoints(index, 1);
    else if (e.ctrlKey) onUpdatePoints(index, -1);
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
        const displayName = `${player.id}:${player.name || ''}`;
        
        // Calculate sets in player's hand
        let ownedSetsCount = 0;
        if (sets) {
          // Check both migration compatibility and new heldSets structure
          const hand = sets.heldSets || sets.items || [];
          ownedSetsCount = hand.filter(s => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(player.id) && !s.used).length;
        }
        
        return (
          <div 
            key={player.id} 
            className={`player-point-item ${isMe ? 'me-item' : ''}`}
            onMouseUp={() => onPlayerMouseUp && onPlayerMouseUp(player.id)}
          >
            <div className="player-cell-top">
              <div className="player-general-container">
                {player.generalOf ? (
                  <div 
                    className={`general-icon ${player.generalOf} clickable`} 
                    onClick={() => onGeneralClick && onGeneralClick(player.id)}
                    title={isMe ? "Click to resign from being General" : `General of ${player.generalOf}s`}
                  ></div>
                ) : (
                  <div className="general-placeholder" title="No General chosen"></div>
                )}
              </div>
              {isPassed && <div className="pass-badge">PASS</div>}
              <div className="player-points-display">
                <span 
                  className="player-points interactive" 
                  onClick={(e) => handleClick(e, index)}
                  title="Shift+Click: +1 | Ctrl+Click: -1"
                >
                  {player.points}
                </span>
              </div>
            </div>

            <div className="player-cell-bottom">
              <div className="player-info-badge" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span className="player-id-label">P{player.id}</span>
                  {ownedSetsCount > 0 && (
                    <div className="owned-sets-badge" title={`${ownedSetsCount} sets in hand`}>
                      {ownedSetsCount} Sets
                    </div>
                  )}
                </div>
                <div 
                  className="manual-toggle-container" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleManualPlayer && onToggleManualPlayer(player.id);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}
                  title="Toggle Manual/AI Control"
                >
                  <input 
                    type="checkbox" 
                    id={`manual-chk-${player.id}`}
                    checked={manualPlayers.some(id => String(id) === String(player.id)) || (currentPlayerId !== null && currentPlayerId !== undefined && String(player.id) === String(currentPlayerId))}
                    readOnly
                    style={{ cursor: 'pointer', margin: 0, width: '11px', height: '11px' }}
                  />
                  <label 
                    htmlFor={`manual-chk-${player.id}`}
                    style={{ fontSize: '0.45rem', fontWeight: 'bold', color: (manualPlayers && manualPlayers.some(id => String(id) === String(player.id))) ? '#3498db' : '#888', cursor: 'pointer', userSelect: 'none' }}
                  >
                    MAN
                  </label>
                </div>
              </div>
            </div>

            <button 
              className="player-switch-btn" 
              onClick={(e) => handleSelectPlayer(e, player.id)}
              title={`Switch to ${displayName}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3l4 4-4 4M8 21l-4-4 4-4M20 7H4M4 17h16" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PlayersPanel;
