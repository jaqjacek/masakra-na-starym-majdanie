import React from 'react';
import { VERSION_INFO } from '../constants/version';

const LandingPage = ({ inputGameId, setInputGameId, onGoToGame }) => {
  
  const handleNewGame = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/next-game-id');
      const data = await res.json();
      if (data.id) {
        window.location.href = `/game/${data.id}`;
      }
    } catch (_err) {
      alert('Failed to get new game ID');
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-header">
        <a href="/admin" className="admin-link-top">Admin Panel</a>
      </div>

      <h1 className="landing-title">Wędrowycz Board Game Simulator</h1>
      <p className="landing-subtitle">Digital Board Game Engine</p>
      
      <div className="landing-card">
        <form className="game-select-form" onSubmit={onGoToGame}>
          <input 
            type="text" 
            placeholder="Enter Game ID..." 
            value={inputGameId} 
            onChange={(e) => setInputGameId(e.target.value)}
            autoFocus
          />
          <button type="submit" className="action-button download-btn" disabled={!inputGameId.trim()}>
            Go to Game
          </button>
        </form>
        
        <div className="landing-divider">OR</div>
        
        <button className="action-button upload-btn new-game-btn" onClick={handleNewGame}>
          Create New Game
        </button>
      </div>

      <div className="landing-footnote">
        <span>{VERSION_INFO.branch}</span>
        <span>{VERSION_INFO.tag}</span>
        <span>#{VERSION_INFO.hash}</span>
        <span>{VERSION_INFO.date} {VERSION_INFO.time}</span>
      </div>
    </div>
  );
};

export default LandingPage;
