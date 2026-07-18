import React from 'react';
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from '../constants/pawnTypes';
import { useTranslation } from '../hooks/useTranslation';

const GameHeader = ({ counters, maxPool, pawnsInPlayLimit, playerOrder = [], currentPlayerIndex, passedPlayers = [] }) => {
  const { t } = useTranslation();
  const currentActiveId = playerOrder[currentPlayerIndex];
  const limits = pawnsInPlayLimit || maxPool;

  const raceNames = {
    vampire: t('vampire'),
    werewolf: t('werewolf'),
    ghost: t('ghost'),
    bardak: t('bardak')
  };

  return (
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

      <div className="pawn-pool-counters">
        {SUMMARY_PAWN_IDS.map(id => (
          <div key={id} className="status-item race-summary" title={t('pawn_pool_counter_tooltip', { race: raceNames[id] || id, sum: maxPool[id] || 0, limit: limits[id] || 0, defaultValue: `Pula: ${raceNames[id] || id} (Suma: ${maxPool[id] || 0}, Limit w grze: ${limits[id] || 0})` })}>
            <div className={`set-icon ${id}`}></div>
            <span>{counters.onBoard[id] || 0}/{limits[id] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHeader;
