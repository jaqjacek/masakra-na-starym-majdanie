import React from 'react';

const PointsTracker = ({ players, onUpdatePoints, currentPlayerId, onPlayerMouseUp, sets }) => {
  const handleClick = (e, index) => {
    if (e.shiftKey) onUpdatePoints(index, 1);
    else if (e.ctrlKey) onUpdatePoints(index, -1);
  };

  const handleSelectPlayer = (e, id) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    if (currentPlayerId === id) {
      url.searchParams.delete('player');
    } else {
      url.searchParams.set('player', id);
    }
    window.location.href = url.toString();
  };

  return (
    <div className="points-tracker full-width">
      {players.map((player, index) => {
        const isMe = player.id === currentPlayerId;
        const displayName = `${player.id}:${player.name || ''}`;
        
        // Calculate sets in player's hand
        let ownedSetsCount = 0;
        if (sets) {
          // Check both migration compatibility and new heldSets structure
          const hand = sets.heldSets || sets.items || [];
          ownedSetsCount = hand.filter(s => s.ownerId === player.id && !s.used).length;
        }
        
        return (
          <div 
            key={player.id} 
            className={`player-point-item ${isMe ? 'me-item' : ''}`}
            onMouseUp={() => onPlayerMouseUp && onPlayerMouseUp(player.id)}
          >
            <div className="player-general-info">
              {player.generalOf && (
                <div className={`general-icon ${player.generalOf}`} title={`General of ${player.generalOf}s`}></div>
              )}
              <div className="player-name-container">
                <span className={`player-name ${isMe ? 'is-me' : ''}`} title={displayName}>
                  {displayName}
                </span>
                {ownedSetsCount > 0 && (
                  <div className="owned-sets-badge" title={`${ownedSetsCount} sets in hand`}>
                    S:{ownedSetsCount}
                  </div>
                )}
              </div>
            </div>
            <span 
              className="player-points interactive" 
              onClick={(e) => handleClick(e, index)}
              title="Shift+Click: +1 | Ctrl+Click: -1"
            >
              {player.points}
            </span>

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

export default PointsTracker;
