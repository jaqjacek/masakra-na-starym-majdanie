import React from 'react';
import { RACES } from '../../constants/game';

/** Pawn pool / play-limit overview shown on the board during the setup phase. */
export default function SetupSummary({ gameState, isMobileUi, canStartSpectator, onStartSpectator: startSpectator, t }) {
  return (
    <div className="setup-summary-wrapper">
      <div className="setup-summary-header">{t('setup_summary_header', { name: gameState.setName || t('setup_random_name', { defaultValue: 'Random' }), defaultValue: `Game Setup: ${gameState.setName || 'Random'}` })}</div>
      <div className="setup-limits-grid">
        <div className="setup-limit-section">
          <h4>{t('setup_total_pawn_pool', { defaultValue: 'Total Pawn Pool' })}</h4>
          <div className="setup-limit-list">
            {RACES.map(race => (
              <div key={race} className="setup-limit-item">
                <div className={`set-icon ${race}`}></div>
                <span>{gameState.sets?.pawns?.[race] || 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="setup-limit-section">
          <h4>{t('setup_pawn_play_limits', { defaultValue: 'Pawn Play Limits' })}</h4>
          <div className="setup-limit-list">
            {RACES.map(race => (
              <div key={race} className="setup-limit-item">
                <div className={`set-icon ${race}`}></div>
                <span>{gameState.sets?.pawnsInPlayLimit?.[race] || gameState.sets?.pawns?.[race] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="setup-hint" style={{ marginTop: '1.5rem', color: '#888', fontSize: '0.8rem' }}>
        {t(isMobileUi ? 'setup_waiting_host_draw_mobile' : 'setup_waiting_host_draw', { defaultValue: 'Waiting for host to click "DRAW SETS" in the top bar...' })}
      </div>
      {canStartSpectator && (
        <button type="button" className="spectator-mode-btn" onClick={() => startSpectator()}>
          {t('spectator_watch')}
        </button>
      )}
    </div>
  );
}
