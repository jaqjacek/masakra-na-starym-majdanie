import React from 'react';

const MouseElement = ({ type, x, y }) => {
  if (!type) return null;
  
  return (
    <div 
      className={`mouse-element ${type.id}`}
      style={{
        left: `${x}px`,
        top: `${y}px`
      }}
    />
  );
};

export default MouseElement;
