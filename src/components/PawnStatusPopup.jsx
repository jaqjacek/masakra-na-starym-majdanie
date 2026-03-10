import React from 'react';
import ReactDOM from 'react-dom';

const PawnStatusPopup = ({ pawn, pawnType, position }) => {
  if (!pawn || !pawnType || !position) return null;

  const style = {
    top: position.y,
    left: position.x
  };

  return ReactDOM.createPortal(
    <div className="portal-status-popup" style={style}>
      <div className="popup-title">{pawnType.name}</div>
      <div className="pawn-health">HP: {pawnType.health}</div>
      <div className="popup-subtitle">Statuses:</div>
      <ul className="status-list">
        {pawn.statuses.length > 0 ? pawn.statuses.map(status => (
          <li key={status} className={`status-item ${status.toLowerCase()}`}>
            {status}
          </li>
        )) : <li className="status-item none">NONE</li>}
      </ul>
    </div>,
    document.body
  );
};

export default PawnStatusPopup;
