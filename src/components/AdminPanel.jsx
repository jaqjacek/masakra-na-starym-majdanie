import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PAWN_TYPES } from '../constants/pawnTypes';

const AdminPanel = () => {
  const [history, setHistory] = useState([]); // Array of { data, setName, id }
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableSets, setAvailableSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [showGenForm, setShowGenForm] = useState(false);

  // Generation form state
  const [genDisplayName, setGenDisplayName] = useState('');
  const [genDescription, setGenDescription] = useState('');
  const [genMaxPower, setGenMaxPower] = useState(6);
  const [genPawns, setGenPawns] = useState({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 });
  const [genPower, setGenPower] = useState({ vampire: 3, werewolf: 2, ghost: 1, bardak: 1 });

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/sets');
      const list = await res.json();
      setAvailableSets(list);
      if (list.length > 0 && !selectedSet) setSelectedSet(list[0]);
    } catch (err) { console.error(err); }
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
    } catch (err) { alert('Failed to generate set'); }
  };

  const simulateGames = async () => {
    setIsSimulating(true);
    setProgress(0);
    const results = [];
    const activeSetName = selectedSet || 'Random';
    
    for (let i = 1; i <= 100; i++) {
      try {
        const url = `http://localhost:3001/api/init/${i}${selectedSet ? `?set=${selectedSet}` : ''}`;
        const response = await fetch(url, { method: 'POST' });
        const result = await response.json();
        if (result.state && result.state.players) {
          const gamePointData = { game: i };
          result.state.players.forEach(p => { gamePointData[p.generalOf] = p.points; });
          results.push(gamePointData);
        }
      } catch (err) { console.error(err); }
      setProgress(i);
    }
    
    const newEntry = {
      id: Date.now(),
      setName: activeSetName,
      data: results
    };

    setHistory(prev => [newEntry, ...prev].slice(0, 5));
    setIsSimulating(false);
  };

  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="custom-chart-legend">
        {payload.map((entry, index) => {
          const pawn = PAWN_TYPES.find(p => p.id === entry.dataKey);
          return (
            <li key={`item-${index}`} className="legend-item">
              <div 
                className={`legend-icon ${pawn.id}`} 
                style={{ backgroundColor: pawn.color }}
              ></div>
              <span style={{ color: entry.color }}>{entry.value}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1>Admin Control Panel</h1>
        <div className="admin-actions">
          <button 
            className="action-button download-btn" 
            onClick={() => setShowGenForm(!showGenForm)}
          >
            {showGenForm ? 'Hide Form' : 'Generate New Set'}
          </button>
          <div className="simulation-control">
            <label>Use Set:</label>
            <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)}>
              <option value="">Random Set</option>
              {availableSets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="action-button upload-btn" onClick={simulateGames} disabled={isSimulating}>
              {isSimulating ? `Simulating... (${progress}%)` : 'Simulate 100 Games'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        {showGenForm && (
          <form className="generation-form" onSubmit={handleGenerate}>
            <h3>Generate New Predefined Set</h3>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>Filename will be generated automatically (e.g. set_1.json)</p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Display Name (Optional):</label>
                <input type="text" value={genDisplayName} onChange={e => setGenDisplayName(e.target.value)} placeholder="Friendly name for the set" />
              </div>
              <div className="form-group">
                <label>Max Power per Set:</label>
                <input type="number" value={genMaxPower} onChange={e => setGenMaxPower(parseInt(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label>Description (Optional):</label>
              <textarea 
                value={genDescription} 
                onChange={e => setGenDescription(e.target.value)} 
                placeholder="What makes this set special?"
                style={{ background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px', padding: '0.5rem', minHeight: '60px' }}
              />
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
            <button type="submit" className="action-button download-btn">Generate & Save</button>
          </form>
        )}

        <div className="simulation-history">
          {history.map((entry, index) => (
            <div key={entry.id} className="simulation-results">
              <div className="result-header">
                <h2>{index === 0 ? 'Latest Run' : `History #${index}`} - Set: {entry.setName}</h2>
                <span className="timestamp">{new Date(entry.id).toLocaleTimeString()}</span>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer>
                  <LineChart data={entry.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="game" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#2c3e50', border: '1px solid #444' }} />
                    <Legend content={renderCustomLegend} />
                    <Line type="monotone" dataKey="vampire" stroke={PAWN_TYPES.find(p => p.id === 'vampire').color} strokeWidth={2} dot={false} isAnimationActive={index === 0} name="Vampire" />
                    <Line type="monotone" dataKey="werewolf" stroke={PAWN_TYPES.find(p => p.id === 'werewolf').color} strokeWidth={2} dot={false} isAnimationActive={index === 0} name="Werewolf" />
                    <Line type="monotone" dataKey="ghost" stroke={PAWN_TYPES.find(p => p.id === 'ghost').color} strokeWidth={2} dot={false} isAnimationActive={index === 0} name="Ghost" />
                    <Line type="monotone" dataKey="bardak" stroke={PAWN_TYPES.find(p => p.id === 'bardak').color} strokeWidth={2} dot={false} isAnimationActive={index === 0} name="Bardak" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
