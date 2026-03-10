import React from 'react';
import { PAWN_TYPES } from '../constants/pawnTypes';

const GameHeader = ({ gameId, counters }) => {
  return (
    <div className="game-header">
      <div className="game-info">Game ID: <strong>{gameId}</strong></div>
      <div className="total-counter">
        <div className="total-sum">Total: {counters.total}</div>
        <div className="counters-breakdown">
          {PAWN_TYPES.map(pawn => (
            <div key={pawn.id} className="breakdown-item">
              <div className={`breakdown-dot ${pawn.id}`}></div>
              <span>{counters.breakdown[pawn.id]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
