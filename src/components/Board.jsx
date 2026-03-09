import React from 'react';
import Region from './Region';

const Board = ({ regions, onRegionMouseUp, onRemovePawn }) => {
  return (
    <div className="board">
      {regions.map((pawnCounts, index) => (
        <Region 
          key={index}
          index={index}
          pawnCounts={pawnCounts}
          onMouseUp={(e) => onRegionMouseUp(index, e)}
          onRemovePawn={(typeId) => onRemovePawn(index, typeId)}
        />
      ))}
    </div>
  );
};

export default Board;
