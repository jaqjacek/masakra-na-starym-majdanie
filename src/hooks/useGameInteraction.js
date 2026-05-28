import { useState, useEffect, useCallback } from 'react';
import { PAWN_TYPES, STATUSES } from '../constants/pawnTypes';
import { Board } from '../constants/board';
import { RACES } from '../constants/game';
import { Scoring } from '../../shared/scoring/scoring.js';
import { applySetToJakubAnger } from '../strategies/jakubStrategy';

const RACE_TO_ABBR = {
  vampire: 'V',
  werewolf: 'W',
  ghost: 'G',
  bardak: 'B'
};

export const useGameInteraction = ({
  gameId,
  playerId,
  gameState,
  availablePool,
  placementPool,
  counters,
  isJakubOnBoard,
  updateGameWithSync,
  addLog,
  findAndRemoveSetById,
  advanceTurn
}) => {
  const [activePawn, setActivePawn] = useState(null); 
  const [activeSet, setActiveSet] = useState(null); 
  const [activeGeneral, setActiveGeneral] = useState(null); 
  const [hoveredPawn, setHoveredPawn] = useState(null);
  const [validMoveTargets, setValidMoveTargets] = useState([]);

  const handleBagMouseDown = useCallback((typeId, e) => {
    const pawnType = PAWN_TYPES.find(p => p.id === typeId);
    if (pawnType.isUnique && (counters.breakdown[typeId] || 0) > 0) return;
    if (placementPool[typeId] <= 0) return; 
    setActivePawn({ typeId, x: e.clientX, y: e.clientY, fromIndex: null });
    setValidMoveTargets(gameState.regions.map(r => r.id));
  }, [gameState, counters.breakdown, placementPool]);

  const handleJakubMouseDownFromPanel = useCallback((e) => {
    if (isJakubOnBoard) return;
    setActivePawn({ typeId: 'jakub', x: e.clientX, y: e.clientY, fromIndex: null });
    setValidMoveTargets(gameState.regions.map(r => r.id));
  }, [isJakubOnBoard, gameState]);

  const handleSetMouseDown = useCallback((set, e) => {
    setActiveSet({ set, x: e.clientX, y: e.clientY });
    
    // Check if enough pawns in pool for this set
    let hasEnough = true;
    Object.entries(set.content).forEach(([tId, count]) => {
      if (availablePool[tId] < count) hasEnough = false;
    });

    if (!hasEnough) {
      setValidMoveTargets([]);
      return;
    }

    const validIndices = gameState.regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0)).map(r => r.id);
    setValidMoveTargets(validIndices);
  }, [gameState, availablePool]);

  const handleGeneralMouseDown = useCallback((race, e) => { if (playerId) return; setActiveGeneral({ race, x: e.clientX, y: e.clientY }); }, [playerId]);

  const handlePawnMouseDown = useCallback((typeId, regionIndex, pawnInstanceIndex, e) => {
    const instances = gameState.regions[regionIndex].pawns[typeId];
    const pawn = instances[pawnInstanceIndex];
    if (pawn.statuses.includes(STATUSES.ENABLED)) {
      if (typeId === 'jakub' && pawn.range <= 0) return;
      setActivePawn({ typeId, x: e.clientX, y: e.clientY, fromIndex: regionIndex, pawnInstanceIndex });
      setHoveredPawn(null);
      const speed = typeId === 'jakub' ? pawn.speed : PAWN_TYPES.find(p => p.id === typeId).speed;
      setValidMoveTargets(Board.getReachableRegions(gameState.regions, regionIndex, speed));
    }
  }, [gameState]);

  useEffect(() => {
    const handleMouseMove = (e) => { 
      if (activePawn) setActivePawn(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
      if (activeSet) setActiveSet(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
      if (activeGeneral) setActiveGeneral(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    };
    const handleGlobalMouseUp = () => { setActivePawn(null); setActiveSet(null); setActiveGeneral(null); setValidMoveTargets([]); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleGlobalMouseUp); };
  }, [activePawn, activeSet, activeGeneral]);

  const handleRegionMouseUp = useCallback((toIndex, e) => {
    if (!gameId) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    if (activePawn) {
      e.stopPropagation(); const { typeId, fromIndex, pawnInstanceIndex } = activePawn;
      if (!validMoveTargets.includes(toIndex)) { setActivePawn(null); setValidMoveTargets([]); return; }
      if (fromIndex !== null) {
        const [movedPawn] = newState.regions[fromIndex].pawns[typeId].splice(pawnInstanceIndex, 1);
        if (newState.regions[fromIndex].pawns[typeId].length === 0) delete newState.regions[fromIndex].pawns[typeId];
        if (typeId === 'jakub') movedPawn.range = Math.max(0, movedPawn.range - 1);
        if (!newState.regions[toIndex].pawns[typeId]) newState.regions[toIndex].pawns[typeId] = [];
        newState.regions[toIndex].pawns[typeId].push(movedPawn);
      } else {
        if (typeId !== 'jakub' && availablePool[typeId] <= 0) { setActivePawn(null); setValidMoveTargets([]); return; }
        const pawnType = PAWN_TYPES.find(p => p.id === typeId);
        const newPawn = { statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) };
        if (!newState.regions[toIndex].pawns[typeId]) newState.regions[toIndex].pawns[typeId] = [];
        newState.regions[toIndex].pawns[typeId].push(newPawn);
      }
      updateGameWithSync(newState); setActivePawn(null); setValidMoveTargets([]);
    }
    if (activeSet) {
      e.stopPropagation();
      if (!validMoveTargets.includes(toIndex)) { setActiveSet(null); setValidMoveTargets([]); return; }
      
      let canPlace = true;
      Object.entries(activeSet.set.content).forEach(([tId, count]) => {
        if (placementPool[tId] < count) canPlace = false;
      });

      if (!canPlace) {
        setActiveSet(null);
        setValidMoveTargets([]);
        return;
      }

      const targetRegion = newState.regions[toIndex];
      const placementScores = Scoring.calculatePlacementPoints(newState.regions, targetRegion, activeSet.set.content);
      
      let logSummary = [];
      newState.players.forEach(p => {
        if (p.generalOf) {
          const abbr = RACE_TO_ABBR[p.generalOf];
          const racePts = placementScores[abbr] || 0;
          if (racePts > 0) {
            p.points += racePts;
            logSummary.push(`${p.generalOf[0].toUpperCase()}:+${racePts}`);
          }
        }
      });

      Object.entries(activeSet.set.content).forEach(([tId, count]) => {
        if (!targetRegion.pawns[tId]) targetRegion.pawns[tId] = [];
        for (let i = 0; i < count; i++) {
          const pawnType = PAWN_TYPES.find(p => p.id === tId);
          targetRegion.pawns[tId].push({ statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) });
        }
      });

      const usedSet = findAndRemoveSetById(newState, activeSet.set.id);
      if (usedSet) {
        usedSet.ownerId = null;
        usedSet.used = false;
        if (!newState.sets.discardPile) newState.sets.discardPile = [];
        newState.sets.discardPile.push(usedSet);
      }

      const limits = newState.sets?.pawnsInPlayLimit || newState.sets?.pawns || {};
      const statusLog = RACES.map(race => {
        const count = newState.regions.reduce((sum, r) => sum + (r.pawns[race]?.length || 0), 0);
        const limit = limits[race] || 0;
        return `${race[0].toUpperCase()}:${count}/${limit}`;
      }).join(' ');

      addLog(newState, `Manual: Set ${activeSet.set.id} placed [${logSummary.join(', ')}] | Board: ${statusLog}`);
      
      if (advanceTurn) advanceTurn(newState);

      updateGameWithSync(newState);
      setActiveSet(null);
      setValidMoveTargets([]);
    }
  }, [activePawn, activeSet, gameState, gameId, validMoveTargets, availablePool, placementPool, updateGameWithSync, addLog, findAndRemoveSetById, advanceTurn]);

  const handlePlayerMouseUp = useCallback((targetPlayerId) => {
    if (activeSet && !playerId) { 
      const newState = JSON.parse(JSON.stringify(gameState)); const s = findAndRemoveSetById(newState, activeSet.set.id);
      if (s) { s.ownerId = targetPlayerId; if (!newState.sets.heldSets) newState.sets.heldSets = []; newState.sets.heldSets.push(s); addLog(newState, `Manual: Distributed Set ${s.id} to Player ${targetPlayerId}`); updateGameWithSync(newState); }
      setActiveSet(null);
    }
    if (activeGeneral && !playerId) { 
      const newState = JSON.parse(JSON.stringify(gameState)); const playerIdx = newState.players.findIndex(p => p.id === targetPlayerId);
      if (playerIdx !== -1) {
        const oldRace = newState.players[playerIdx].generalOf; if (oldRace) newState.availableGenerals.push(oldRace);
        newState.players[playerIdx].generalOf = activeGeneral.race; newState.availableGenerals = newState.availableGenerals.filter(r => r !== activeGeneral.race);
        updateGameWithSync(newState);
      }
      setActiveGeneral(null);
    }
  }, [activeSet, activeGeneral, gameState, playerId, updateGameWithSync, addLog, findAndRemoveSetById]);

  const handleJakubMouseUp = useCallback((e) => {
    if (activeSet) {
      e.stopPropagation();
      const newState = JSON.parse(JSON.stringify(gameState));
      const curId = playerId || newState.playerOrder[newState.currentPlayerIndex];
      const playerIdx = newState.players.findIndex(p => p.id === curId);
      
      if (playerIdx !== -1) {
        const s = findAndRemoveSetById(newState, activeSet.set.id);
        if (s) {
          newState.players[playerIdx].points += 1;
          s.ownerId = 'jakub';
          if (!newState.sets.heldSets) newState.sets.heldSets = [];
          newState.sets.heldSets.push(s);
          
          // Automatically update Jakub Anger
          let jakub = null;
          for (const r of newState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }
          if (jakub) {
            const result = applySetToJakubAnger(jakub, s.content);
            jakub.anger = result.anger;
            jakub.range = result.range;
            addLog(newState, `Player ${curId} gave Set ${s.id} to Jakub. Anger updated | Range: ${jakub.range}`);
          } else {
            addLog(newState, `Player ${curId} gave Set ${s.id} to Jakub for 1 pt.`);
          }
          if (advanceTurn) advanceTurn(newState);
        }
        updateGameWithSync(newState);
      }
      setActiveSet(null);
      setValidMoveTargets([]);
    }
  }, [activeSet, gameState, playerId, updateGameWithSync, addLog, findAndRemoveSetById, advanceTurn]);

  return {
    activePawn,
    activeSet,
    activeGeneral,
    hoveredPawn,
    setHoveredPawn,
    validMoveTargets,
    handleBagMouseDown,
    handleJakubMouseDownFromPanel,
    handleSetMouseDown,
    handleGeneralMouseDown,
    handlePawnMouseDown,
    handleRegionMouseUp,
    handlePlayerMouseUp,
    handleJakubMouseUp
  };
};
