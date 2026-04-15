import React from 'react';

const Bag = ({ type, onMouseDown, disabled, availableCount, onBoard, limit }) => {
  const isOutOfStock = availableCount <= 0;
  const showLimit = onBoard !== undefined && limit !== undefined;

  return (
    <div 
      className={`bag-wrapper ${disabled || isOutOfStock ? 'disabled-bag' : ''}`}
      onMouseDown={(disabled || isOutOfStock) ? null : onMouseDown}
    >
      <div 
        className="bag"
        title={disabled ? `${type.name} is already on the map` : `Available: ${availableCount}`}
      >
        <div className={`pawn-preview ${type.id}`}></div>
        <div className="bag-count-badge">{availableCount}</div>
      </div>
      <span className="bag-label">{type.name}</span>
      {showLimit && (
        <span className="bag-limit-sub">{onBoard}/{limit}</span>
      )}
    </div>
  );
};

export default Bag;
