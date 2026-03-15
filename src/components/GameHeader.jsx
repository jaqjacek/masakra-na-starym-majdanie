import React from 'react';
import { PAWN_TYPES } from '../constants/pawnTypes';

const GameHeader = ({ counters, maxPool }) => {
  return (
    <div className="game-status-horizontal">
      <div className="status-item total-summary">
        T: <strong>{counters.total}</strong>
      </div>
      {PAWN_TYPES.filter(p => !p.isUnique).map(pawn => (
        <div key={pawn.id} className="status-item race-summary">
          <div className={`breakdown-dot ${pawn.id}`}></div>
          <span>{counters.breakdown[pawn.id]}/{maxPool[pawn.id] || 0}</span>
        </div>
      ))}
    </div>
  );
};

export default GameHeader;
