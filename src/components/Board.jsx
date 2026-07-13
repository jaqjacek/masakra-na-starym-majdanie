import React from 'react';
import Region from './Region';
import JakubTracksManager from './board/JakubTracksManager';
import VisualEffectsManager from './board/VisualEffectsManager';
import JakubOverlay from './board/JakubOverlay';

const BoardComponent = ({ 
  regions, 
  onRegionMouseUp, 
  onRemovePawn, 
  onAddPawn, 
  onPawnMouseDown, 
  setHoveredPawn, 
  validMoveTargets, 
  children, 
  onRegionMouseEnter, 
  onRegionMouseLeave,
  jakubPath = [],
  currentRound,
  currentPhase,
  showTracks = true,
  showCounters = true,
  showAnimations = true,
  visualEffects = [],
  witnessGlows = {},
  jakubInstance,
  jakubRegion,
  autoplaySpeed,
  onJakubMouseEnter,
  onJakubMouseLeave
}) => {
  return (
    <div className="board-wrapper">
      <div className="board-background-layer"></div>
      <div className="board">
        <JakubTracksManager 
          jakubPath={jakubPath}
          regions={regions}
          currentRound={currentRound}
          currentPhase={currentPhase}
          visible={showTracks}
        />
        <VisualEffectsManager 
          visualEffects={visualEffects}
          regions={regions}
          visible={showAnimations}
        />
        <JakubOverlay 
          jakub={jakubInstance}
          region={jakubRegion}
          autoplaySpeed={autoplaySpeed}
          onMouseEnter={onJakubMouseEnter}
          onMouseLeave={onJakubMouseLeave}
        />
        {regions.map((region) => (
          <Region 
            key={region.id}
            region={region}
            pawnGroups={region.pawns}
            isValidTarget={validMoveTargets.includes(region.id)}
            witnessGlowRaces={witnessGlows[region.id] || []}
            onMouseUp={(e) => onRegionMouseUp(region.id, e)}
            onRemovePawn={(typeId) => onRemovePawn(region.id, typeId)}
            onAddPawn={(typeId) => onAddPawn(region.id, typeId)}
            onPawnMouseDown={(typeId, pIdx, e) => onPawnMouseDown(typeId, region.id, pIdx, e)}
            setHoveredPawn={setHoveredPawn}
            onMouseEnter={() => onRegionMouseEnter && onRegionMouseEnter(region.id)}
            onMouseLeave={() => onRegionMouseLeave && onRegionMouseLeave(region.id)}
            showCounters={showCounters}
          />
        ))}
      </div>
      {children}
    </div>
  );
};

export default BoardComponent;
