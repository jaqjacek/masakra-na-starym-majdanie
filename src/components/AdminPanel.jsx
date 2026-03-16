import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PAWN_TYPES } from '../constants/pawnTypes';
import SetsPanel from './SetsPanel';

const AdminPanel = () => {
  const [history, setHistory] = useState([]); // Array of { data, setName, id }
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableSets, setAvailableSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadedSetPreview, setLoadedSetPreview] = useState(null);
  const [globalDefaultSet, setGlobalDefaultSet] = useState(null);
  const [showGenForm, setShowGenForm] = useState(false);

  // Generation form state
  const [genDisplayName, setGenDisplayName] = useState('');
  const [genDescription, setGenDescription] = useState('');
  const [genMaxPower, setGenMaxPower] = useState(6);
  const [genPawns, setGenPawns] = useState({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 });
  const [genPower, setGenPower] = useState({ vampire: 3, werewolf: 2, ghost: 1, bardak: 1 });

  const fetchSets = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/sets');
      const list = await res.json();
      setAvailableSets(list);
      if (list.length > 0 && !selectedSet) setSelectedSet(list[0]);
    } catch (_err) { console.error(_err); }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/config');
      const config = await res.json();
      setGlobalDefaultSet(config.defaultSetName);
    } catch (_err) { console.error(_err); }
  };

  const fetchSetPreview = async (setName) => {
    try {
      const res = await fetch(`http://localhost:3001/api/sets/details/${setName}`);
      const data = await res.json();
      setLoadedSetPreview(data);
    } catch (_err) { console.error(_err); }
  };

  useEffect(() => {
    fetchSets();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (selectedSet) {
      fetchSetPreview(selectedSet);
    } else {
      setLoadedSetPreview(null);
      setShowPreview(false);
    }
  }, [selectedSet]);

  const setAsDefault = async () => {
    if (!selectedSet) return;
    try {
      await fetch('http://localhost:3001/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultSetName: selectedSet })
      });
      setGlobalDefaultSet(selectedSet);
      alert(`${selectedSet} is now the global default for new games.`);
    } catch (_err) { alert('Failed to set global default'); }
  };

  const handleLoadSet = async () => {
    if (!loadedSetPreview) return;
    const data = loadedSetPreview;
    setGenDisplayName(data.displayName || '');
    setGenDescription(data.description || '');
    setGenMaxPower(data.maxPower || 6);
    setGenPawns(data.pawns || { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 });
    setGenPower(data.power || { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 });
    setShowGenForm(true);
  };

  const clearAllGames = async () => {
    if (!window.confirm('Are you sure you want to delete ALL game sessions? This cannot be undone.')) return;
    try {
      const res = await fetch('http://localhost:3001/api/games', { method: 'DELETE' });
      const data = await res.json();
      alert(data.message);
    } catch (_err) { alert('Failed to clear games'); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/sets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          displayName: genDisplayName, 
          description: genDescription,
          pawns: genPawns, 
          power: genPower, 
          maxPower: genMaxPower 
        })
      });
      const result = await response.json();
      setGenDisplayName('');
      setGenDescription('');
      setShowGenForm(false);
      fetchSets();
      alert(`Set generated successfully as: ${result.name}`);
    } catch (_err) { alert('Failed to generate set'); }
  };

  const simulateGames = async () => {
    setIsSimulating(true);
    setProgress(0);
    setShowPreview(false); // Hide preview when simulating
    const results = [];
    const activeSetName = selectedSet || 'Random';
    
    for (let i = 1; i <= 100; i++) {
      try {
        const url = `http://localhost:3001/api/simulate/${i}${selectedSet ? `?set=${selectedSet}` : ''}`;
        const response = await fetch(url, { method: 'POST' });
        const result = await response.json();
        
        if (result.scores) {
          const gamePointData = { game: i };
          result.scores.forEach(s => {
            gamePointData[s.race] = s.points;
          });
          results.push(gamePointData);
        }
      } catch (_err) { console.error(_err); }
      setProgress(i);
    }
    
    if (results.length > 0) {
      const newEntry = { id: Date.now(), setName: activeSetName, data: results };
      setHistory(prev => [newEntry, ...prev].slice(0, 5));
    }
    setIsSimulating(false);
  };

  const calculateWins = (data) => {
    const wins = { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 };
    data.forEach(game => {
      const scores = [
        { race: 'vampire', pts: game.vampire || 0 },
        { race: 'werewolf', pts: game.werewolf || 0 },
        { race: 'ghost', pts: game.ghost || 0 },
        { race: 'bardak', pts: game.bardak || 0 }
      ];
      scores.sort((a, b) => b.pts - a.pts);
      if (scores[0].pts > 0) wins[scores[0].race]++;
    });
    return wins;
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <div className="admin-title-group">
          <h1>Admin Control Panel</h1>
          <button className="action-button" style={{ backgroundColor: '#7f8c8d', marginLeft: '1rem' }} onClick={() => { window.history.pushState({}, '', '/'); window.location.reload(); }}>
            ← Back to Game Selection
          </button>
        </div>
        <div className="admin-actions">
          <button className="action-button" style={{ backgroundColor: '#c0392b' }} onClick={clearAllGames}>
            Delete All Game Sessions
          </button>
          <button className="action-button download-btn" onClick={() => setShowGenForm(!showGenForm)}>
            {showGenForm ? 'Hide Form' : 'Generate New Set'}
          </button>
          
          <div className="simulation-control">
            <div className="default-status">
              Default: <strong>{globalDefaultSet || 'None'}</strong>
            </div>
            <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)}>
              <option value="">Select Set...</option>
              {availableSets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="action-button" style={{ backgroundColor: '#9b59b6' }} onClick={() => setShowPreview(!showPreview)} disabled={!selectedSet}>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button className="action-button" style={{ backgroundColor: '#3498db' }} onClick={handleLoadSet} disabled={!selectedSet}>
              Load Set
            </button>
            <button className="action-button" style={{ backgroundColor: '#27ae60' }} onClick={setAsDefault} disabled={!selectedSet}>
              Set as Default
            </button>
            <button className="action-button upload-btn" onClick={simulateGames} disabled={isSimulating}>
              {isSimulating ? `Simulating... (${progress}%)` : 'Simulate 100 Full Games'}
            </button>
          </div>
        </div>
      </div>

      {showPreview && loadedSetPreview && !isSimulating && (
        <div className="set-preview-area">
          <SetsPanel 
            sets={loadedSetPreview.drawPile || loadedSetPreview.items} 
            title={`Preview: ${selectedSet}`} 
            setInfo={loadedSetPreview}
            onSetMouseDown={() => {}} 
          />
        </div>
      )}

      <div className="admin-content">
        {showGenForm && (
          <form className="generation-form" onSubmit={handleGenerate}>
            <h3>Generate / Edit Predefined Set</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Display Name (Optional):</label>
                <input type="text" value={genDisplayName} onChange={e => setGenDisplayName(e.target.value)} placeholder="Friendly name" />
              </div>
              <div className="form-group">
                <label>Max Power per Set:</label>
                <input type="number" value={genMaxPower} onChange={e => setGenMaxPower(parseInt(e.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label>Description (Optional):</label>
              <textarea value={genDescription} onChange={e => setGenDescription(e.target.value)} placeholder="Description..." style={{ background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px', padding: '0.5rem', minHeight: '60px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div className="form-grid">
              <div>
                <h4>Pawn Totals</h4>
                {Object.keys(genPawns).map(race => (
                  <div key={race} className="input-row">
                    <label>{race}:</label>
                    <input type="number" value={genPawns[race]} onChange={e => setGenPawns({...genPawns, [race]: parseInt(e.target.value)})} />
                  </div>
                ))}
              </div>
              <div>
                <h4>Power Config</h4>
                {Object.keys(genPower).map(race => (
                  <div key={race} className="input-row">
                    <label>{race}:</label>
                    <input type="number" value={genPower[race]} onChange={e => setGenPower({...genPower, [race]: parseInt(e.target.value)})} />
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="action-button download-btn">Generate & Save as New</button>
          </form>
        )}

        <div className="simulation-history">
          {history.map((entry, index) => {
            const wins = calculateWins(entry.data);
            return (
              <div key={entry.id} className="simulation-results">
                <div className="result-header">
                  <h2>{index === 0 ? 'Latest Run (Final Scores)' : `History #${index} (Final Scores)`} - Set: {entry.setName}</h2>
                  <span className="timestamp">{new Date(entry.id).toLocaleTimeString()}</span>
                </div>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={entry.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="game" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#2c3e50', border: '1px solid #444' }} />
                      <Line type="monotone" dataKey="vampire" stroke={PAWN_TYPES.find(p => p.id === 'vampire').color} strokeWidth={2} dot={false} isAnimationActive={index === 0} />
                      <Line type="monotone" dataKey="werewolf" stroke={PAWN_TYPES.find(p => p.id === 'werewolf').color} strokeWidth={2} dot={false} isAnimationActive={index === 0} />
                      <Line type="monotone" dataKey="ghost" stroke={PAWN_TYPES.find(p => p.id === 'ghost').color} strokeWidth={2} dot={false} isAnimationActive={index === 0} />
                      <Line type="monotone" dataKey="bardak" stroke={PAWN_TYPES.find(p => p.id === 'bardak').color} strokeWidth={2} dot={false} isAnimationActive={index === 0} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="custom-legend-row">
                  {PAWN_TYPES.filter(p => !p.isUnique).map(pawn => (
                    <div key={pawn.id} className="legend-stat-item">
                      <div className={`legend-dot ${pawn.id}`} style={{ backgroundColor: pawn.color }}></div>
                      <span className="legend-label">
                        {pawn.name}: <strong>({wins[pawn.id]} wins)</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
