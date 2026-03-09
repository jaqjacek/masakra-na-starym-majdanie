import React from 'react';

const Bag = ({ type, onMouseDown }) => {
  return (
    <div 
      className="bag-wrapper"
      onMouseDown={onMouseDown}
    >
      <div 
        className="bag"
        title={`Infinite bag of ${type.name}s`}
      >
        <div className={`pawn-preview ${type.id}`}></div>
      </div>
      <span className="bag-label">{type.name}</span>
    </div>
  );
};

export default Bag;
