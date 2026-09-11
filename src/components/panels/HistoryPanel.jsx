import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { translateLog } from '../../utils/logTranslator';
import '../../assets/css/panels/history.css';

const HistoryPanel = ({ logs = [] }) => {
  const { t, lang } = useTranslation();
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const displayLogs = logs.slice(-100);

  return (
    <div className="history-panel">
      <h3>{t('history_panel_title', { defaultValue: 'Game History (last 100)' })}</h3>
      <div className="history-log-container" ref={containerRef}>
        {displayLogs.length > 0 ? (
          displayLogs.map((log, index) => (
            <div key={index} className="history-log-item">
              <span className="log-time">[{log.time}] </span>
              <span className="log-text">{translateLog(log.text, lang, t)}</span>
            </div>
          ))
        ) : (
          <div className="history-empty">{t('history_empty', { defaultValue: 'No events yet...' })}</div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
