import React from 'react';
import Region from './Region';

const BoardComponent = ({ regions, onRegionMouseUp, onRemovePawn, onAddPawn, onPawnMouseDown, setHoveredPawn, validMoveTargets }) => {
  return (
    <div className="board-wrapper">
      <div className="board-background-layer"></div>
      <div className="board">
        {regions.map((region) => (
          <Region 
            key={region.id}
            pawnGroups={region.pawns}
            isValidTarget={validMoveTargets.includes(region.id)}
            onMouseUp={(e) => onRegionMouseUp(region.id, e)}
            onRemovePawn={(typeId) => onRemovePawn(region.id, typeId)}
            onAddPawn={(typeId) => onAddPawn(region.id, typeId)}
            onPawnMouseDown={(typeId, pIdx, e) => onPawnMouseDown(typeId, region.id, pIdx, e)}
            setHoveredPawn={setHoveredPawn}
          />
        ))}
      </div>
    </div>
  );
};

export default BoardComponent;
