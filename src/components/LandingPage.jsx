import React, { useState, useEffect } from 'react';
import '../assets/css/landing.css';
import Footer from './Footer';
import { SERVER_URL } from '../constants/constants';
import { useTranslation } from '../hooks/useTranslation';

const LandingPage = ({ onGoToGame }) => {
  const { t } = useTranslation();
  const [inputGameId, setInputGameId] = useState('');
  const [gameTitle, setGameTitle] = useState('Wędrowycz Board Game Simulator');

  useEffect(() => {
    fetch(`${SERVER_URL}/api/config/title`)
      .then(res => res.json())
      .then(data => setGameTitle(data.title))
      .catch(console.error);
  }, []);

  const handleGoToGame = (e) => {
    e.preventDefault();
    if (inputGameId.trim()) {
      onGoToGame(inputGameId.trim());
    }
  };

  const handleNewGame = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/map/new`, { method: 'POST' });
      const data = await res.json();
      if (data.id !== undefined) {
        window.location.href = `/game/${data.id}`;
      }
    } catch (_err) {
      alert(t('failed_game_id'));
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-header">
        <a href="/admin" className="admin-link-top">{t('admin_panel')}</a>
      </div>

      <h1 className="landing-title">{gameTitle}</h1>
      <p className="landing-subtitle">{t('landing_subtitle')}</p>
      
      <div className="landing-card">
        <form className="game-select-form" onSubmit={handleGoToGame}>
          <input
            type="text"
            placeholder={t('enter_game_id')}
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
            autoFocus
          />
          <button type="submit" className="action-button" disabled={!inputGameId.trim()}>
            {t('go_to_game')}
          </button>
        </form>
        <div className="landing-divider">{t('or')}</div>
        
        <button className="action-button new-game-btn" onClick={handleNewGame}>
          {t('create_new_game')}
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default LandingPage;
