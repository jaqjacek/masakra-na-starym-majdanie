import React from 'react';
import ReactDOM from 'react-dom';

const PawnStatusPopup = ({ pawn, pawnType, position }) => {
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

  return ReactDOM.createPortal(
    <div className="portal-status-popup" style={style}>
      <div className="popup-title">{pawnType.name}</div>
      <div className="pawn-health">PŻ: {pawnType.health}</div>
      <div className="pawn-speed" style={{ fontSize: '0.7rem', color: '#3498db', textAlign: 'center', marginBottom: '0.3rem' }}>
        Szybkość: {pawnType.speed}
      </div>
      <div className="popup-subtitle">Statusy:</div>
      <ul className="status-list">
        {pawn.statuses.length > 0 ? pawn.statuses.map(status => (
          <li key={status} className={`status-item ${status.toLowerCase()}`}>
            {STATUS_MAP_PL[status] || status}
          </li>
        )) : <li className="status-item none">BRAK</li>}
      </ul>
    </div>,
    document.body
  );
};

export default PawnStatusPopup;
