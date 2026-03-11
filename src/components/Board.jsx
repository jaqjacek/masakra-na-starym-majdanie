import React from 'react';
import Region from './Region';

const Board = ({ regions, onRegionMouseUp, onRemovePawn, onAddPawn, onPawnMouseDown, setHoveredPawn, validMoveTargets }) => {
  return (
    <div className="board">
      {regions.map((region, index) => (
        <Region 
          key={region.id}
          index={index}
          pawnGroups={region.pawns}
          onMouseUp={(e) => onRegionMouseUp(index, e)}
          onRemovePawn={(typeId) => onRemovePawn(index, typeId)}
          onAddPawn={(typeId) => onAddPawn(index, typeId)}
          onPawnMouseDown={(typeId, pawnIndex, e) => onPawnMouseDown(typeId, index, pawnIndex, e)}
          setHoveredPawn={setHoveredPawn}
          isValidTarget={validMoveTargets.includes(index)}
        />
      ))}
    </div>
  );
};

export default Board;
