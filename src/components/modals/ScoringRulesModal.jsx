import React from 'react';

/** Quick scoring reference opened from the Game panel. */
const ScoringRulesModal = ({ onClose, t }) => (
  <div className="scoring-modal-overlay" onClick={onClose}>
    <div className="scoring-modal-content" onClick={e => e.stopPropagation()}>
      <button className="modal-close-x" onClick={onClose}>×</button>
      <div className="scoring-rules-container">
        <h2>{t('scoring_popup_title')}</h2>
        <div className="rules-section">
          <h3>{t('scoring_popup_immediate_title')}</h3>
          <p><span className="rules-race-icon vampire"></span><strong>{t('vampire')}:</strong> {t('scoring_popup_vampire_desc')}</p>
          <p><span className="rules-race-icon werewolf"></span><strong>{t('werewolf')}:</strong> {t('scoring_popup_werewolf_desc')}</p>
          <p><span className="rules-race-icon ghost"></span><strong>{t('ghost')}:</strong> {t('scoring_popup_ghost_desc')}</p>
          <p><span className="rules-race-icon bardak"></span><strong>{t('bardak')}:</strong> {t('scoring_popup_bardak_desc')}</p>
        </div>
        <div className="rules-section">
          <h3>{t('scoring_popup_witness_title')}</h3>
          <p>{t('scoring_popup_witness_desc')}</p>
        </div>
        <div className="rules-section">
          <h3>{t('scoring_popup_endgame_title')}</h3>
          <p><span className="rules-race-icon vampire"></span><strong>{t('vampire')}:</strong> {t('scoring_popup_endgame_vampire')}</p>
          <p><span className="rules-race-icon werewolf"></span><strong>{t('werewolf')}:</strong> {t('scoring_popup_endgame_werewolf')}</p>
          <p><span className="rules-race-icon ghost"></span><strong>{t('ghost')}:</strong> {t('scoring_popup_endgame_ghost')}</p>
          <p><span className="rules-race-icon bardak"></span><strong>{t('bardak')}:</strong> {t('scoring_popup_endgame_bardak')}</p>
        </div>
      </div>
    </div>
  </div>
);

export default ScoringRulesModal;
