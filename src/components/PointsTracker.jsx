import React from 'react';

const PointsTracker = ({ players, onUpdatePoints, currentPlayerId }) => {
  const handleClick = (e, index) => {
    if (e.shiftKey) {
      onUpdatePoints(index, 1);
    } else if (e.ctrlKey) {
      onUpdatePoints(index, -1);
    }
  };

  const handleSelectPlayer = (id) => {
    const url = new URL(window.location.href);
    url.searchParams.set('player', id);
    window.location.href = url.toString();
  };

  return (
    <div className="points-tracker full-width">
      {players.map((player, index) => {
        const isMe = player.id === currentPlayerId;
        const displayName = `${player.id}:${player.name || ''}`;
        
        return (
          <div key={player.id} className="player-point-item">
            <div className="player-name-container">
              <span className={`player-name ${isMe ? 'is-me' : ''}`} title={displayName}>
                {displayName}
              </span>
              {!currentPlayerId && (
                <div 
                  className="player-select-dot" 
                  onClick={() => handleSelectPlayer(player.id)}
                  title={`Join as ${displayName}`}
                ></div>
              )}
            </div>
            <span 
              className="player-points interactive" 
              onClick={(e) => handleClick(e, index)}
              title="Shift+Click: +1 | Ctrl+Click: -1"
            >
              {player.points}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PointsTracker;
