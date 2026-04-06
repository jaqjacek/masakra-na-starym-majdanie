import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PAWN_TYPES } from '../constants/pawnTypes';
import { RACES } from '../constants/game';
import { SERVER_URL } from '../constants/constants';
import '../assets/css/admin.css';
import Footer from './Footer';

const AdminSimulate = () => {
  const [data, setData] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableSets, setAvailableSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState('');

  const fetchSets = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/sets`);
      const list = await res.json(); setAvailableSets(list);
    } catch (_err) { console.error(_err); }
  };

  useEffect(() => { fetchSets(); }, []);

  const simulateGames = async () => {
    setIsSimulating(true);
    setProgress(0);
    const results = [];
    
    for (let i = 1; i <= 100; i++) {
      try {
        const url = `${SERVER_URL}/api/simulate/${i}${selectedSet ? `?set=${selectedSet}` : ''}`;
        const response = await fetch(url, { method: 'POST' });
        const result = await response.json();
        
        if (result.analytics) {
          const gameEntry = { game: i };
          RACES.forEach(race => {
            gameEntry[`${race}_afterR1`] = result.analytics[race].afterR1;
            gameEntry[`${race}_total`] = result.analytics[race].total;
            gameEntry[`${race}_finalBonus`] = result.analytics[race].finalBonus;
            gameEntry[`${race}_killed`] = result.analytics[race].killed;
            gameEntry[`${race}_ramboPoints`] = result.analytics[race].ramboPoints;
          });
          results.push(gameEntry);
        }
      } catch (err) { console.error(err); }
      setProgress(i);
      setData([...results]);
    }
    setIsSimulating(false);
  };

  const getRaceColor = (raceId) => PAWN_TYPES.find(p => p.id === raceId)?.color || '#ccc';

  const ChartBox = ({ title, dataKeySuffix, data }) => (
    <div className="simulation-chart-box">
      <h3>{title}</h3>
      <div className="chart-wrapper small">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="game" stroke="#888" hide />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: '#2c3e50', border: '1px solid #444' }} />
            {RACES.map(race => (
              <Line 
                key={race} 
                type="monotone" 
                dataKey={`${race}_${dataKeySuffix}`} 
                stroke={getRaceColor(race)} 
                strokeWidth={2} 
                dot={false} 
                name={race}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="admin-page-content">
      <div className="admin-actions-bar">
        <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)}>
          <option value="">Select Set for Simulation...</option>
          {availableSets.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="action-button upload-btn" onClick={simulateGames} disabled={isSimulating}>
          {isSimulating ? `Simulating... (${progress}%)` : 'Run 100 Game Analytics'}
        </button>
      </div>

      {data.length > 0 && (
        <div className="simulation-dashboard">
          <div className="simulation-summary-header">
            <h2>Simulation Results: {selectedSet || 'Random'}</h2>
            <p>Analyzing performance across {data.length} games</p>
          </div>
          
          <div className="charts-grid">
            <ChartBox title="1. Points After Round 1 (Early Game)" dataKeySuffix="afterR1" data={data} />
            <ChartBox title="2. Total Points (Final Game Score)" dataKeySuffix="total" data={data} />
            <ChartBox title="3. Final Phase Bonus Points" dataKeySuffix="finalBonus" data={data} />
            <ChartBox title="4. Rambo Survivor Bonus Points" dataKeySuffix="ramboPoints" data={data} />
            <ChartBox title="5. Pawns Killed by Jakub (Total)" dataKeySuffix="killed" data={data} />
          </div>

          <div className="custom-legend-row large">
            {RACES.map(race => (
              <div key={race} className="legend-stat-item">
                <div className={`legend-dot ${race}`} style={{ backgroundColor: getRaceColor(race) }}></div>
                <span className="legend-label">{race.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminSimulate;
