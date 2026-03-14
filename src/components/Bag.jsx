import React from 'react';

const Bag = ({ type, onMouseDown, disabled, availableCount }) => {
  const isOutOfStock = availableCount <= 0;

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
    </div>
  );
};

export default Bag;
