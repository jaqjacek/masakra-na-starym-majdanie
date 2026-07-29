import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './assets/css/base.css';
import App from './App.jsx';
import { GameProvider } from './context/GameContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
);
