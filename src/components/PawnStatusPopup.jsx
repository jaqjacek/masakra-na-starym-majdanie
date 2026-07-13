import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from '../hooks/useTranslation';

const PawnStatusPopup = ({ pawn, pawnType, position }) => {
  const { t } = useTranslation();
  if (!pawn || !pawnType || !position) return null;

  const style = {
    top: position.y,
    left: position.x
  };

  const STATUS_MAP_PL = {
    DISABLED: 'NIEAKTYWNY',
    ENABLED: 'AKTYWNY',
    INVINCIBLE: 'NIEZNISZCZALNY',
    CURSED: 'PRZEKLĘTY',
    BLEED: 'KRWAWIENIE',
    SLOW: 'SPOWOLNIONY',
    BLESSED: 'BŁOGOSŁAWIONY',
    FAST: 'SZYBKI'
  };

  const getStatusLabel = (status) => {
    return t(`status_${status.toLowerCase()}`, { defaultValue: STATUS_MAP_PL[status] || status });
  };

  return ReactDOM.createPortal(
    <div className="portal-status-popup" style={style}>
      <div className="popup-title">{t(pawnType.id, { defaultValue: pawnType.name })}</div>
      <div className="pawn-health">{t('pawn_hp', { defaultValue: 'PŻ' })}: {pawnType.health}</div>
      <div className="pawn-speed" style={{ fontSize: '0.7rem', color: '#3498db', textAlign: 'center', marginBottom: '0.3rem' }}>
        {t('pawn_speed', { defaultValue: 'Szybkość' })}: {pawnType.speed}
      </div>
      <div className="popup-subtitle">{t('pawn_statuses_label', { defaultValue: 'Statusy:' })}</div>
      <ul className="status-list">
        {pawn.statuses.length > 0 ? pawn.statuses.map(status => (
          <li key={status} className={`status-item ${status.toLowerCase()}`}>
            {getStatusLabel(status)}
          </li>
        )) : <li className="status-item none">{t('status_none', { defaultValue: 'BRAK' })}</li>}
      </ul>
    </div>,
    document.body
  );
};

export default PawnStatusPopup;
