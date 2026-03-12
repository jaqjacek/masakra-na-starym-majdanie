import React from 'react';

const Bag = ({ type, onMouseDown, disabled }) => {
  return (
    <div 
      className={`bag-wrapper ${disabled ? 'disabled-bag' : ''}`}
      onMouseDown={disabled ? null : onMouseDown}
    >
      <div 
        className="bag"
        title={disabled ? `${type.name} is already on the map` : `Infinite bag of ${type.name}s`}
      >
        <div className={`pawn-preview ${type.id}`}></div>
      </div>
      <span className="bag-label">{type.name}</span>
    </div>
  );
};

export default Bag;
