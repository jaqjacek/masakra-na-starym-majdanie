import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import '../assets/css/panels/header.css';

const GameHeader = ({ playerOrder = [], currentPlayerIndex, passedPlayers = [], currentRound, totalRounds }) => {
  const { t } = useTranslation();
  const currentActiveId = playerOrder[currentPlayerIndex];

  return (
    <div className="game-status-horizontal">
      <span className="round-indicator">R:{currentRound}/{totalRounds}</span>
      <div className="player-order-track">
        <span className="order-label">{t('turn_order_label', { defaultValue: 'TURA:' })}</span>
        {playerOrder.map((pid) => {
          const isCurrent = pid === currentActiveId;
          const isPassed = passedPlayers.includes(pid);
          return (
            <div
              key={pid}
              className={`order-item ${isCurrent ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
            >
              P{pid}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameHeader;
