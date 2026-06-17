import React, { useEffect, useState } from 'react';

const LoadSavesPanel = ({ gameId, onClose, onLoadRound, serverUrl }) => {
  const [saves, setSaves] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
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
        setError('Nie udało się pobrać zapisów rund.');
      } finally {
        setLoading(false);
      }
    };
    fetchSaves();
  }, [gameId, serverUrl]);

  const handleLoad = () => {
    if (selectedRound !== null) {
      onLoadRound(selectedRound);
    }
  };

  return (
    <div className="load-saves-modal-overlay" onClick={onClose}>
      <div className="load-saves-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-x" onClick={onClose}>×</button>
        <h3>Wczytaj zapis rundy</h3>
        
        {loading && <div className="loading-saves">Ładowanie zapisów...</div>}
        {error && <div className="error-saves">{error}</div>}
        
        {!loading && !error && (
          <>
            {saves.length === 0 ? (
              <div className="no-saves-message" style={{ margin: '20px 0', textAlign: 'center', color: '#aaa' }}>
                Brak dostępnych zapisów dla tej gry.
              </div>
            ) : (
              <div className="saves-list">
                {saves.map(round => (
                  <div 
                    key={round} 
                    className={`save-item ${selectedRound === round ? 'selected' : ''}`}
                    onClick={() => setSelectedRound(round)}
                  >
                    <div className="save-item-info">
                      <span className="save-item-title">Runda {round}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="load-btn-container">
              <button 
                className="load-action-btn" 
                disabled={selectedRound === null}
                onClick={handleLoad}
              >
                Wczytaj
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadSavesPanel;
