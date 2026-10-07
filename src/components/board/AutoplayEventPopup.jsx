import React from 'react';

const EVENT_POPUP_TICK_DOTS = 6;

/** Board overlay announcing the active event while autoplay counts down. */
export default function AutoplayEventPopup({ popup: autoplayEventPopup, t }) {
  if (!autoplayEventPopup) return null;
  return (
    <div className="autoplay-event-popup-wrapper">
      <div className="autoplay-event-popup-glow"></div>
      <div className="autoplay-event-badge">⚠️ {t('active_event_badge_board', { defaultValue: 'BOARD EVENT ACTIVE' })}</div>
      <h2 className="autoplay-event-title">{t(`event.${autoplayEventPopup.event.id}.title`, { defaultValue: autoplayEventPopup.event.title })}</h2>
      <div className="autoplay-event-divider"></div>
      <p className="autoplay-event-description">{t(`event.${autoplayEventPopup.event.id}.description`, { defaultValue: autoplayEventPopup.event.description })}</p>
      <div className="autoplay-event-footer">
        <div className="autoplay-event-ticks-container">
          {Array.from({ length: EVENT_POPUP_TICK_DOTS }).map((_, idx) => (
            <div 
               key={idx} 
               className={`autoplay-event-tick-dot ${idx < autoplayEventPopup.ticksLeft ? 'active' : ''}`}
            />
          ))}
        </div>
        <span className="autoplay-event-countdown-text">
          {t('resuming_autoplay_ticks', { ticks: autoplayEventPopup.ticksLeft, defaultValue: `Resuming autoplay in ${autoplayEventPopup.ticksLeft} ticks...` })}
        </span>
      </div>
    </div>
  );
}
