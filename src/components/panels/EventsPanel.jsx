import React, { useState } from 'react';

const EventsPanel = ({ events, onClose, onTriggerEvent }) => {
  console.log('EventsPanel rendering with events:', events);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const popupWidth = 230; // 200px width + padding + borders + safe margin
    const popupHeight = 160; // Estimated max height + safe margin
    
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    
    // Check horizontal boundaries
    if (x + popupWidth > window.innerWidth) {
      x = e.clientX - popupWidth - 10;
    }
    
    // Check vertical boundaries
    if (y + popupHeight > window.innerHeight) {
      y = e.clientY - popupHeight - 10;
    }
    
    setMousePos({ 
      x: Math.max(10, x), 
      y: Math.max(10, y) 
    });
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
                onMouseDown={(e) => {
                  if (e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    onTriggerEvent && onTriggerEvent(event.id);
                  }
                }}
                title="Shift+LPP: Uruchom wydarzenie ręcznie"
              >
                <div className={`event-icon drawn event-${event.type}`}>E</div>
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
                onMouseDown={(e) => {
                  if (e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    onTriggerEvent && onTriggerEvent(event.id);
                  }
                }}
                title="Shift+LPP: Uruchom wydarzenie ręcznie"
              >
                <div className={`event-icon event-${event.type}`}>E</div>
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
