import React from 'react';

const PawnGhost = ({ type, x, y }) => {
  if (!type) return null;
  
  return (
    <div 
      className={`pawn-ghost ${type.id}`}
      style={{
        left: `${x}px`,
        top: `${y}px`
      }}
    />
  );
};

export default PawnGhost;
