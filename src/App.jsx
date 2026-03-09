import React, { useState, useCallback, useEffect, useMemo } from 'react';
import './App.css';
import Board from './components/Board';
import Bag from './components/Bag';
import PawnGhost from './components/PawnGhost';

import vampireIcon from './assets/icons/vampire.svg';
import werewolfIcon from './assets/icons/werewolf.svg';
import ghostIcon from './assets/icons/ghost.svg';
import bardakIcon from './assets/icons/bardak.svg';

// Configuration for pawn types
export const PAWN_TYPES = [
  { id: 'vampire', icon: vampireIcon, label: 'V', name: 'Vampire', color: '#8B0000' },
  { id: 'werewolf', icon: werewolfIcon, label: 'W', name: 'Werewolf', color: '#A0522D' },
  { id: 'ghost', icon: ghostIcon, label: 'G', name: 'Ghost', color: '#F0F8FF' },
  { id: 'bardak', icon: bardakIcon, label: 'B', name: 'Bardak', color: '#696969' },
];

const INITIAL_BOARD = Array(25).fill(null).map(() => ({}));

function App() {
  // State for the board: array of 25 objects { [pawnTypeId]: count }
  const [board, setBoard] = useState(INITIAL_BOARD);
  
  // State for the active drag
  const [activePawn, setActivePawn] = useState(null); // { typeId, x, y }
  
  // Total and breakdown pawn counters
  const counters = useMemo(() => {
    const breakdown = PAWN_TYPES.reduce((acc, pawn) => {
      acc[pawn.id] = 0;
      return acc;
    }, {});

    let total = 0;

    board.forEach(region => {
      Object.entries(region).forEach(([typeId, count]) => {
        breakdown[typeId] += count;
        total += count;
      });
    });

    return { total, breakdown };
  }, [board]);

  // Handle pawn pick up from bag
  const handleBagMouseDown = useCallback((typeId, e) => {
    setActivePawn({
      typeId,
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  // Handle global mouse move to update pawn ghost position
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (activePawn) {
        setActivePawn(prev => ({
          ...prev,
          x: e.clientX,
          y: e.clientY
        }));
      }
    };

    const handleGlobalMouseUp = () => {
      if (activePawn) {
        setActivePawn(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [activePawn]);

  // Handle placing pawn on a region
  const handleRegionMouseUp = useCallback((index, e) => {
    if (activePawn) {
      e.stopPropagation();
      const typeId = activePawn.typeId;
      
      setBoard(prevBoard => {
        const newBoard = [...prevBoard];
        const currentCount = newBoard[index][typeId] || 0;
        newBoard[index] = {
          ...newBoard[index],
          [typeId]: currentCount + 1
        };
        return newBoard;
      });
      
      setActivePawn(null);
    }
  }, [activePawn]);

  // Handle removing pawn from a region (right click or middle click if needed)
  const handleRegionRemove = useCallback((index, typeId) => {
    setBoard(prevBoard => {
      const newBoard = [...prevBoard];
      const currentCount = newBoard[index][typeId] || 0;
      if (currentCount > 0) {
        const newRegion = { ...newBoard[index] };
        if (currentCount === 1) {
          delete newRegion[typeId];
        } else {
          newRegion[typeId] = currentCount - 1;
        }
        newBoard[index] = newRegion;
      }
      return newBoard;
    });
  }, []);

  const handleResetBoard = useCallback(() => {
    if (window.confirm('Are you sure you want to reset the board? All pawns will be removed.')) {
      setBoard(Array(25).fill(null).map(() => ({})));
    }
  }, []);

  const handleDownloadBoard = useCallback(() => {
    const dataStr = JSON.stringify(board, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'wedrowycz_board.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  }, [board]);

  const handleUploadBoard = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const uploadedBoard = JSON.parse(e.target.result);
        if (Array.isArray(uploadedBoard) && uploadedBoard.length === 25) {
          setBoard(uploadedBoard);
        } else {
          alert('Invalid board file format.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be uploaded again
    event.target.value = '';
  }, []);

  return (
    <div className="app-container">
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
      
      <div className="game-layout">
        <div className="bags-container">
          {PAWN_TYPES.map(pawn => (
            <Bag 
              key={pawn.id}
              type={pawn}
              onMouseDown={(e) => handleBagMouseDown(pawn.id, e)}
            />
          ))}
        </div>
        
        <Board 
          regions={board}
          onRegionMouseUp={handleRegionMouseUp}
          onRemovePawn={handleRegionRemove}
        />
      </div>

      <div className="button-bar">
        <button className="action-button download-btn" onClick={handleDownloadBoard}>
          Download Board
        </button>
        <label className="action-button upload-btn">
          Upload Board
          <input 
            type="file" 
            accept=".json" 
            onChange={handleUploadBoard} 
            style={{ display: 'none' }} 
          />
        </label>
        <button className="action-button reset-btn" onClick={handleResetBoard}>
          Reset Board
        </button>
      </div>

      {activePawn && (
        <PawnGhost 
          type={PAWN_TYPES.find(p => p.id === activePawn.typeId)}
          x={activePawn.x}
          y={activePawn.y}
        />
      )}
    </div>
  );
}

export default App;
