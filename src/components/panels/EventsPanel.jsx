import React, { useState } from 'react';

const EventsPanel = ({ events, onClose }) => {
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX + 15, y: e.clientY + 15 });
  };

  const drawn = events?.drawn || [];
  const pool = events?.pool || [];

  return (
    <div className="events-panel-popup">
      <div className="events-panel-header">
        <h3>Game Events</h3>
        <button className="close-panel-btn" onClick={onClose}>×</button>
      </div>
      <div className="events-panel-content">
        <div className="events-column">
          <h4>History ({drawn.length})</h4>
          <div className="events-grid">
            {drawn.map(event => (
              <div 
                key={`drawn-${event.id}`} 
                className="event-icon-container"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <div className="event-icon drawn">E</div>
                <span>{event.id}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="events-column">
          <h4>Pool ({pool.length})</h4>
          <div className="events-grid">
            {pool.map(event => (
              <div 
                key={`pool-${event.id}`} 
                className="event-icon-container"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <div className="event-icon">E</div>
                <span>{event.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hoveredEvent && (
        <div 
          className="event-popup-desc" 
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <h5>{hoveredEvent.title} (ID: {hoveredEvent.id})</h5>
          <p>{hoveredEvent.description}</p>
        </div>
      )}
    </div>
  );
};

export default EventsPanel;
