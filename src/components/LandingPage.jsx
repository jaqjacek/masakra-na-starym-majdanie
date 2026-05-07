import React, { useState } from 'react';
import '../assets/css/landing.css';
import Footer from './Footer';
import { SERVER_URL } from '../constants/constants';

const LandingPage = ({ onGoToGame }) => {
  const [inputGameId, setInputGameId] = useState('');

  const handleGoToGame = (e) => {
    e.preventDefault();
    if (inputGameId.trim()) {
      onGoToGame(inputGameId.trim());
    }
  };

  const handleNewGame = async () => {

    try {
      const res = await fetch(`${SERVER_URL}/api/map/next-id`);
      const data = await res.json();
      if (data.id !== undefined) {
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
        <form className="game-select-form" onSubmit={handleGoToGame}>
          <input
            type="text"
            placeholder="Enter Game ID..."
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
            autoFocus
          />
          <button type="submit" className="action-button" disabled={!inputGameId.trim()}>
            Go to Game
          </button>
        </form>
        <div className="landing-divider">OR</div>
        
        <button className="action-button new-game-btn" onClick={handleNewGame}>
          Create New Game
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default LandingPage;
