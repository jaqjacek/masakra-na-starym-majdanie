import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PAWN_TYPES } from '../constants/pawnTypes';
import { VERSION_INFO } from '../constants/version';

const AdminSimulate = () => {
  const [history, setHistory] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableSets, setAvailableSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState('');

  useEffect(() => { fetchSets(); }, []);
  const fetchSets = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/sets');
      const list = await res.json(); setAvailableSets(list);
    } catch (err) { console.error(err); }
  };

  const simulateGames = async () => {
    setIsSimulating(true); setProgress(0);
    const results = []; const activeSetName = selectedSet || 'Random';
    for (let i = 1; i <= 100; i++) {
      try {
        const url = `http://localhost:3001/api/simulate/${i}${selectedSet ? `?set=${selectedSet}` : ''}`;
        const response = await fetch(url, { method: 'POST' });
        const result = await response.json();
        if (result.scores) {
          const gamePointData = { game: i };
          result.scores.forEach(s => { gamePointData[s.race] = s.points; });
          results.push(gamePointData);
        }
      } catch (err) { console.error(err); }
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
      const scores = [ { race: 'vampire', pts: game.vampire || 0 }, { race: 'werewolf', pts: game.werewolf || 0 }, { race: 'ghost', pts: game.ghost || 0 }, { race: 'bardak', pts: game.bardak || 0 } ];
      scores.sort((a, b) => b.pts - a.pts);
      if (scores[0].pts > 0) wins[scores[0].race]++;
    });
    return wins;
  };

  return (
    <div className="admin-page-content">
      <div className="admin-actions-bar">
        <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)}>
          <option value="">Select Set for Simulation...</option>
          {availableSets.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="action-button upload-btn" onClick={simulateGames} disabled={isSimulating}>{isSimulating ? `Simulating... (${progress}%)` : 'Simulate 100 Full Games'}</button>
      </div>

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
                    <span className="legend-label">{pawn.name}: <strong>({wins[pawn.id]} wins)</strong></span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="landing-footnote">
        <span>{VERSION_INFO.branch}</span>
        <span>{VERSION_INFO.tag}</span>
        <span>#{VERSION_INFO.hash}</span>
        <span>{VERSION_INFO.date} {VERSION_INFO.time}</span>
      </div>
    </div>
  );
};

export default AdminSimulate;
