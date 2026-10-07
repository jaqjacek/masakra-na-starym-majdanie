import React from 'react';

/** General selection strip shown above the board during the general phase. */
export default function GeneralsPoolPicker({
  gameState,
  playerId,
  onGeneralMouseDown: handleGeneralMouseDown,
  onSelectGeneral: handleSelectGeneral,
  t
}) {
  const activeId = gameState.playerOrder[gameState.currentPlayerIndex];

  // If playerId is defined and it's not our turn to choose, we wait
  if (playerId !== null && playerId !== undefined && String(playerId) !== String(activeId)) {
    return (
      <div className="generals-pool-wrapper" style={{ textAlign: 'center', padding: '15px' }}>
        <div className="generals-pool-header">
          {t('waiting_for_general', { player: activeId })}
        </div>
      </div>
    );
  }

  const player = gameState.players.find(p => p.id !== null && p.id !== undefined && String(p.id) === String(activeId));
  const hasGeneral = !!player?.generalOf;

  return (
    <div className="generals-pool-wrapper">
      <div className="generals-pool-header">
        {hasGeneral ? t('general_chosen') : t('choose_general_for', { player: activeId })}
      </div>
      <div className="generals-pool-horizontal">
        {gameState.availableGenerals.map(race => (
          <button
            type="button"
            key={race}
            className={`general-icon large portrait ${race} ${hasGeneral ? 'disabled' : ''}`}
            onMouseDown={(e) => !hasGeneral && handleGeneralMouseDown(race, e)}
            onClick={() => !hasGeneral && handleSelectGeneral(race)}
            title={hasGeneral ? t('general_portrait_title') : t('general_icon_title', { race: t(race) })}
          >
          </button>
        ))}
      </div>
    </div>
  );
}
