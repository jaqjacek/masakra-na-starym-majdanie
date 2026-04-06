import React, { useEffect, useRef } from 'react';

const HistoryPanel = ({ logs = [] }) => {
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="history-panel">
      <h3>Game History</h3>
      <div className="history-log-container" ref={containerRef}>
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="history-log-item">
              <span className="log-time">[{log.time}] </span>
              <span className="log-text">{log.text}</span>
            </div>
          ))
        ) : (
          <div className="history-empty">No events yet...</div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
