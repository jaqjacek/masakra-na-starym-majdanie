import React from 'react';
import { SUMMARY_PAWN_IDS } from '../../constants/pawnTypes';

/** Bottom action bar on mobile: selected-set preview, give/cancel, and phase-advance buttons. */
export default function MobileActionBar({
  gameState,
  activeSet,
  activePawn,
  canPass,
  onGiveJakub,
  onCancel,
  onDrawSets,
  onExecuteEvent,
  onGoToJakubPhase,
  onGoToPlayerPhase,
  onPass,
  t
}) {
  const idle = !activeSet && !activePawn;
  const allPassed = gameState.phase === 'player_phase'
    && (gameState.passedPlayers || []).length === (gameState.players || []).length;
  const allGeneralsChosen = gameState.phase === 'general_phase'
    && (gameState.players || []).every((p) => p.generalOf);

  const visible = activeSet || activePawn || canPass
    || gameState.phase === 'setup' || gameState.phase === 'event_phase'
    || allPassed || allGeneralsChosen;
  if (!visible) return null;

  return (
    <div className="mobile-action-bar">
      {activeSet && (
        <div className="mobile-action-preview">
          {SUMMARY_PAWN_IDS.map(typeId => {
            const count = activeSet.set.content[typeId] || 0;
            return Array.from({ length: count }).map((_, i) => (
              <div key={`${typeId}-${i}`} className={`set-icon ${typeId}`}></div>
            ));
          })}
        </div>
      )}
      {activeSet && (
        <button type="button" className="give-jakub" onClick={(e) => onGiveJakub(e)}>
          {t('action_give_jakub')}
        </button>
      )}
      {(activeSet || activePawn) && (
        <button type="button" onClick={onCancel}>{t('action_cancel')}</button>
      )}
      {idle && gameState.phase === 'setup' && (
        <button type="button" className="action-button next-btn" onClick={onDrawSets}>{t('draw_sets')}</button>
      )}
      {idle && gameState.phase === 'event_phase' && (
        <button type="button" className="action-button next-btn" onClick={onExecuteEvent}>{t('execute_event')}</button>
      )}
      {idle && allPassed && (
        <button type="button" className="action-button next-btn" onClick={onGoToJakubPhase}>{t('go_to_jakub_phase')}</button>
      )}
      {idle && allGeneralsChosen && (
        <button type="button" className="action-button next-btn" onClick={onGoToPlayerPhase}>{t('go_to_player_phase')}</button>
      )}
      {idle && canPass && (
        <button type="button" className="pass-btn" onClick={onPass}>
          {t('pass')}
        </button>
      )}
    </div>
  );
}
