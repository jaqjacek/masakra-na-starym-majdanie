import React from 'react';
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from '../constants/pawnTypes';

const GameHeader = ({ counters, maxPool, pawnsInPlayLimit, playerOrder = [], currentPlayerIndex, passedPlayers = [] }) => {
  const currentActiveId = playerOrder[currentPlayerIndex];
  const limits = pawnsInPlayLimit || maxPool;

  return (
    <div className="game-status-horizontal">
      <div className="pawn-pool-counters">
        {SUMMARY_PAWN_IDS.map(id => (
          <div key={id} className="status-item race-summary" title={`Pula: ${id === 'vampire' ? 'Wampiry' : id === 'werewolf' ? 'Wilkołaki' : id === 'ghost' ? 'Duchy' : 'Bardaki'} (Suma: ${maxPool[id] || 0}, Limit w grze: ${limits[id] || 0})`}>
            <div className={`set-icon ${id}`}></div>
            <span>{counters.onBoard[id] || 0}/{limits[id] || 0}</span>
          </div>
        ))}
      </div>

      <div className="player-order-track">
        <span className="order-label">TURA:</span>
        {playerOrder.map((pid) => {
          const isCurrent = pid === currentActiveId;
          const isPassed = passedPlayers.includes(pid);
          return (
            <div 
              key={pid} 
              className={`order-item ${isCurrent ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
            >
              P{pid}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameHeader;
