import React, { useEffect, useRef } from 'react';
import '../assets/css/board.css';
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
  onJakubMouseLeave,
  miniBoard = false,
  isMobileUi = false,
  placementArmed = false,
  onLongPressPawn
}) => {
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    if (!isMobileUi) {
      el.style.removeProperty('--cell');
      return undefined;
    }
    const apply = () => {
      const cell = Math.max(28, Math.min(137, Math.floor(Math.min(el.clientWidth, el.clientHeight) / 6)));
      el.style.setProperty('--cell', `${cell}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobileUi]);

  return (
    <div ref={wrapRef} className={`board-wrapper ${miniBoard && !isMobileUi ? 'mini-board' : ''}`}>
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
            isMobileUi={isMobileUi}
            placementArmed={placementArmed}
            onLongPressPawn={(typeId, pawn, pawnType, e) => onLongPressPawn && onLongPressPawn(region.id, typeId, pawn, pawnType, e)}
          />
        ))}
      </div>
      {children}
    </div>
  );
};

export default BoardComponent;
