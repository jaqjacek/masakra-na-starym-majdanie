import React from 'react';
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from '../constants/pawnTypes';

const GameHeader = ({ counters, maxPool, playerOrder = [], currentPlayerIndex, passedPlayers = [] }) => {
  const currentActiveId = playerOrder[currentPlayerIndex];

  return (
    <div className="game-status-horizontal">
      <div className="pawn-pool-counters">
        {SUMMARY_PAWN_IDS.map(id => (
          <div key={id} className="status-item race-summary" title={`${id} pool`}>
            <div className={`set-icon ${id}`}></div>
            <span>{counters.breakdown[id] || 0}/{maxPool[id] || 0}</span>
          </div>
        ))}
      </div>

      <div className="player-order-track">
        <span className="order-label">TURN:</span>
        {playerOrder.map((pid, idx) => {
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
