import React from 'react';

/** Banner describing the AI / other-player action currently being revealed. */
const SpectatorActionPopup = ({ action, t }) => {
  if (!action) return null;
  return (
    <div className="spectator-action-popup" role="status">
      <div className="spectator-action-title">
        {action.type === 'pass' && t('spectator_passed', { name: action.playerName })}
        {action.type === 'kablowanie' && t('spectator_snitched', { name: action.playerName })}
        {action.type === 'general' && t('spectator_general', { name: action.playerName, race: t(action.race) })}
        {action.type === 'draw' && t('spectator_draw', { round: action.round })}
        {action.type === 'event' && t('spectator_event', { title: action.title || '—' })}
        {action.type === 'final' && t('spectator_final')}
      </div>
      {action.type === 'event' && action.description && (
        <div className="spectator-action-fury">{action.description}</div>
      )}
      {action.type === 'kablowanie' && (
        <>
          <div className="spectator-action-set">
            {Object.entries(action.setContent || {})
              .filter(([, count]) => count > 0)
              .map(([race, count]) => (
                <span key={race} className={`spectator-chip race-${race}`}>{t(race)} ×{count}</span>
              ))}
          </div>
          <div className="spectator-action-fury">
            <span>{t('spectator_range', { range: action.range ?? '—' })}</span>
            {Object.entries(action.anger || {}).map(([race, value]) => (
              <span key={race}>{t(race)}: {value}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SpectatorActionPopup;
