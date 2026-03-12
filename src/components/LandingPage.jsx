import React from 'react';

const LandingPage = ({ inputGameId, setInputGameId, onGoToGame }) => {
  return (
    <div className="landing-container">
      <h1>Wedrowycz Gemini</h1>
      <p>Enter Game ID to join or create a new game:</p>
      <form onSubmit={onGoToGame} className="game-select-form">
        <input 
          type="text" 
          value={inputGameId} 
          onChange={(e) => setInputGameId(e.target.value)}
          placeholder="e.g. 123, my-game, etc."
          required
        />
        <button type="submit" className="action-button upload-btn">Go to Game</button>
      </form>
      <div className="landing-footer">
        <a href="/admin" className="admin-link">Open Admin Control Panel</a>
      </div>
    </div>
  );
};

export default LandingPage;
