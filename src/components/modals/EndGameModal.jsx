import React, { useMemo } from 'react';
import { RACES } from '../../../shared/constants.js';

const EMPTY_STATS = {
  races: {}, scores: {}, losses: {}, placement: {}, witness: {}, final: {}, passing: {}, killedByJakub: {}, setsPlayed: {}
};

const RUNNER_RANKS = [
  { key: 'rank_2', className: 'silver' },
  { key: 'rank_3', className: 'bronze' },
  { key: 'rank_4', className: 'fourth' }
];

/** Points descending; ties broken by general hierarchy (RACES order). */
function rankPlayers(players) {
  if (!players) return [];
  return [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return RACES.indexOf(a.generalOf) - RACES.indexOf(b.generalOf);
  });
}

const PlayerStats = ({ player, isSmall = false, mercyActive, t }) => {
  const stats = player.stats || EMPTY_STATS;
  const chosenRaces = RACES.filter(race => (stats.races[race] || 0) > 0);

  if (chosenRaces.length === 0) {
    return <div className="no-stats-text">{t('no_stats_text')}</div>;
  }

  return (
    <div className={`player-stats-grid ${isSmall ? 'small' : ''}`}>
      {chosenRaces.map(race => {
        const times = stats.races[race] || 0;
        const score = stats.scores[race] || 0;
        const loss = stats.losses[race] || 0;
        const placement = (stats.placement || stats.rambo || {})[race] || 0;
        const witness = stats.witness[race] || 0;
        const final = stats.final[race] || 0;
        const passing = stats.passing[race] || 0;
        const mercy = stats.mercy?.[race] || 0;
        const killed = stats.killedByJakub[race] || 0;
        const setsCount = stats.setsPlayed[race] || 0;

        return (
          <div key={race} className={`race-stat-row ${race}`}>
            <div className="race-header-info">
              <div className={`general-icon small ${race}`} />
              <span className="race-name">{t(race)}</span>
              <span className="race-times">({times}x)</span>
            </div>
            <div className="race-metrics">
              <div className="metric-item score-metric" title={t('stats_tooltip_scored')}>
                <span className="metric-label">{t('stats_scored')}</span>
                <span className="metric-value">+{score}</span>
              </div>
              <div className="metric-item loss-metric" title={t('stats_tooltip_lost')}>
                <span className="metric-label">{t('stats_lost')}</span>
                <span className="metric-value">-{loss}</span>
              </div>
              <div className="metric-item placement-metric" title={t('stats_tooltip_assault')}>
                <span className="metric-label">{t('stats_assault')}</span>
                <span className="metric-value">{placement > 0 ? `+${placement}` : placement}</span>
              </div>
              <div className="metric-item witness-metric" title={t('stats_tooltip_witness')}>
                <span className="metric-label">{t('stats_witness')}</span>
                <span className="metric-value">+{witness}</span>
              </div>
              <div className="metric-item final-metric" title={t('stats_tooltip_final')}>
                <span className="metric-label">{t('stats_final')}</span>
                <span className="metric-value">+{final}</span>
              </div>
              <div className="metric-item passing-metric" title={t('stats_tooltip_passing')}>
                <span className="metric-label">{t('stats_passing')}</span>
                <span className="metric-value">+{passing}</span>
              </div>
              <div className="metric-item mercy-metric" title={mercyActive === false ? t('stats_mercy_disabled_tooltip', { defaultValue: 'Mercy Phase disabled' }) : t('stats_tooltip_mercy', { defaultValue: 'Points from Jakub\'s Mercy' })}>
                <span className="metric-label">😇 {t('stats_mercy', { defaultValue: 'Mercy' })}</span>
                <span className="metric-value">{mercyActive === false ? t('stats_no_mercy', { defaultValue: 'No mercy' }) : `+${mercy}`}</span>
              </div>
              <div className="metric-item killed-metric" title={t('stats_tooltip_killed', { defaultValue: 'Killed by Jakub' })}>
                <span className="metric-label">💀 {t('stats_killed', { defaultValue: 'Killed' })}</span>
                <span className="metric-value">-{killed}</span>
              </div>
              <div className="metric-item sets-metric" title={t('stats_tooltip_played_sets', { defaultValue: 'Played sets' })}>
                <span className="metric-label">🃏 {t('stats_played_sets', { defaultValue: 'Sets' })}</span>
                <span className="metric-value">{setsCount}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Final rankings with per-race stats breakdown. */
const EndGameModal = ({ players, mercyActive, canReplaySpectator, onReplaySpectator, onClose, t }) => {
  const sortedPlayers = useMemo(() => rankPlayers(players), [players]);
  const winner = sortedPlayers[0];

  return (
    <div className="end-game-modal-overlay" onClick={onClose}>
      <div className="end-game-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-x" onClick={onClose}>×</button>
        <div className="end-game-header">
          <div className="trophy-glow">🏆</div>
          <h2>{t('endgame_modal_title')}</h2>
        </div>

        {winner && (
          <div className="end-game-rankings">
            <div className="rank-card winner-card">
              <div className="rank-badge gold">{t('rank_1')}</div>
              <div className="player-details">
                <h3 className="winner-title">{t('endgame_winner_title', { id: winner.id, name: winner.name })}</h3>
                <div className="final-score">{t('endgame_points', { points: winner.points })}</div>
              </div>
              <div className="stats-breakdown">
                <PlayerStats player={winner} mercyActive={mercyActive} t={t} />
              </div>
            </div>

            <div className="runners-up-grid">
              {sortedPlayers.slice(1).map((player, idx) => {
                const rank = RUNNER_RANKS[Math.min(idx, RUNNER_RANKS.length - 1)];
                return (
                  <div key={player.id} className={`rank-card runner-card ${rank.className}`}>
                    <div className={`rank-badge ${rank.className}`}>{t(rank.key)}</div>
                    <div className="player-details">
                      <h4>{t('endgame_runner_title', { id: player.id, name: player.name })}</h4>
                      <div className="final-score">{t('endgame_points', { points: player.points })}</div>
                    </div>
                    <div className="stats-breakdown">
                      <PlayerStats player={player} isSmall mercyActive={mercyActive} t={t} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="end-game-footer">
          {canReplaySpectator && (
            <button type="button" className="spectator-mode-btn" onClick={onReplaySpectator}>
              {t('spectator_replay')}
            </button>
          )}
          <button className="close-popup-btn" onClick={onClose}>
            {t('endgame_back_to_board')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndGameModal;
