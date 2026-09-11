import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import '../assets/css/panels/bags.css';

const Bag = ({ type, onMouseDown, disabled, availableCount, onBoard, limit, isMobileUi = false }) => {
  const { t } = useTranslation();
  const isOutOfStock = availableCount <= 0;
  const showLimit = onBoard !== undefined && limit !== undefined;

  return (
    <div 
      className={`bag-wrapper ${disabled || isOutOfStock ? 'disabled-bag' : ''}`}
      onMouseDown={(disabled || isOutOfStock || isMobileUi) ? null : onMouseDown}
      onClick={(disabled || isOutOfStock || !isMobileUi) ? null : onMouseDown}
    >
      <div 
        className="bag"
        title={disabled ? t('witness_pawn_limit_on_board', { name: t(type.id), defaultValue: `${type.name} znajduje się już na planszy` }) : t('witness_pawn_limit_available', { count: availableCount, defaultValue: `Dostępne: ${availableCount}` })}
      >
        <div className={`pawn-preview ${type.id}`}></div>
        <div className="bag-count-badge">{availableCount}</div>
      </div>
      {showLimit && (
        <span className="bag-limit-sub">{onBoard}/{limit}</span>
      )}
    </div>
  );
};

export default Bag;
