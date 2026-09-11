import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import '../../assets/css/panels/load-saves.css';

const LoadSavesPanel = ({ gameId, onClose, onLoadSnapshot, serverUrl }) => {
  const { t } = useTranslation();
  const [saves, setSaves] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaves = async () => {
      try {
        const response = await fetch(`${serverUrl}/api/map/${gameId}/saves`);
        if (!response.ok) throw new Error('Failed to fetch saves');
        const data = await response.json();
        setSaves(data.saves || []);
      } catch (err) {
        console.error(err);
        setError(t('load_saves_error', { defaultValue: 'Nie udało się pobrać zapisów rund.' }));
      } finally {
        setLoading(false);
      }
    };
    fetchSaves();
  }, [gameId, serverUrl, t]);

  const handleLoad = () => {
    if (selectedSnapshot !== null) {
      onLoadSnapshot(selectedSnapshot);
    }
  };

  return (
    <div className="load-saves-modal-overlay" onClick={onClose}>
      <div className="load-saves-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-x" onClick={onClose}>×</button>
        <h3>{t('load_saves_title', { defaultValue: 'Wczytaj zapis rundy' })}</h3>
        
        {loading && <div className="loading-saves">{t('load_saves_loading', { defaultValue: 'Ładowanie zapisów...' })}</div>}
        {error && <div className="error-saves">{error}</div>}
        
        {!loading && !error && (
          <>
            {saves.length === 0 ? (
              <div className="no-saves-message" style={{ margin: '20px 0', textAlign: 'center', color: '#aaa' }}>
                {t('load_saves_empty', { defaultValue: 'Brak dostępnych zapisów dla tej gry.' })}
              </div>
            ) : (
              <div className="saves-list">
                {saves.map(snap => {
                  const phaseName = snap.phase.replace('_', ' ').toUpperCase();
                  const timeString = new Date(snap.timestamp).toLocaleTimeString();
                  return (
                    <div 
                      key={snap.id} 
                      className={`save-item ${selectedSnapshot === snap.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSnapshot(snap.id)}
                    >
                      <div className="save-item-info">
                        <span className="save-item-title">
                          {t('load_saves_item_round', { round: snap.round, defaultValue: `Runda ${snap.round}` })} - {phaseName} ({timeString})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="load-btn-container">
              <button 
                className="load-action-btn" 
                disabled={selectedSnapshot === null}
                onClick={handleLoad}
              >
                {t('load_saves_load_btn', { defaultValue: 'Wczytaj' })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadSavesPanel;
