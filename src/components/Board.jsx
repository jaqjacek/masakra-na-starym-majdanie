import React from 'react';
import Region from './Region';

const Board = ({ regions, onRegionMouseUp, onRemovePawn, onPawnMouseDown, setHoveredPawn }) => {
  return (
    <div className="board">
      {regions.map((pawnGroups, index) => (
        <Region 
          key={index}
          index={index}
          pawnGroups={pawnGroups}
          onMouseUp={(e) => onRegionMouseUp(index, e)}
          onRemovePawn={(typeId) => onRemovePawn(index, typeId)}
          onPawnMouseDown={(typeId, pawnIndex, e) => onPawnMouseDown(typeId, index, pawnIndex, e)}
          setHoveredPawn={setHoveredPawn}
        />
      ))}
    </div>
  );
};

export default Board;
