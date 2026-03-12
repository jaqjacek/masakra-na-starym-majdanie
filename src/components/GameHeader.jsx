import React from 'react';
import { PAWN_TYPES } from '../constants/pawnTypes';

const GameHeader = ({ counters }) => {
  return (
    <div className="game-status-bar">
      <div className="counters-breakdown">
        <div className="breakdown-item total">
          <span className="total-label">TOTAL:</span>
          <strong>{counters.total}</strong>
        </div>
        {PAWN_TYPES.filter(p => !p.isUnique).map(pawn => (
          <div key={pawn.id} className="breakdown-item">
            <div className={`breakdown-dot ${pawn.id}`}></div>
            <span>{counters.breakdown[pawn.id]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHeader;
