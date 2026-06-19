import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PAWN_TYPES } from '../constants/pawnTypes';
import { RACES } from '../constants/game';
import { SERVER_URL } from '../constants/constants';
import '../assets/css/admin.css';
import Footer from './Footer';

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
          <Tooltip 
            contentStyle={{ backgroundColor: '#555555', border: '2px solid #777777', borderRadius: '6px', padding: '10px 14px' }}
            labelStyle={{ color: '#ffd54f', fontWeight: 'bold', textShadow: '1px 1px 2px #000', marginBottom: '4px' }}
            itemStyle={{ color: '#fffdf0', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}
          />
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

const ScoreDiffChartBox = ({ title, data }) => (
  <div className="simulation-chart-box">
    <h3>{title}</h3>
    <div className="chart-wrapper small">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="game" stroke="#888" hide />
          <YAxis stroke="#888" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#555555', border: '2px solid #777777', borderRadius: '6px', padding: '10px 14px' }}
            labelStyle={{ color: '#ffd54f', fontWeight: 'bold', textShadow: '1px 1px 2px #000', marginBottom: '4px' }}
            itemStyle={{ color: '#fffdf0', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}
          />
          <Line 
            type="monotone" 
            dataKey="scoreDiff" 
            stroke="#9b59b6" 
            strokeWidth={3} 
            dot={false} 
            name="1st vs Last"
          />
          <Line 
            type="monotone" 
            dataKey="scoreDiff1st2nd" 
            stroke="#2ecc71" 
            strokeWidth={3} 
            dot={false} 
            name="1st vs 2nd"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

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
    
    // Smooth progress simulation to show the "simulate running process" in the UI
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 45);

    try {
      const url = `${SERVER_URL}/api/simulate/batch?count=100${selectedSet ? `&set=${selectedSet}` : ''}`;
      const response = await fetch(url, { method: 'POST' });
      const batchResults = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      const mappedResults = batchResults.map(result => {
        const gameEntry = { game: result.game };
        RACES.forEach(race => {
          gameEntry[`${race}_afterR1`] = result.analytics[race].afterR1;
          gameEntry[`${race}_fewestPointsChoice`] = result.analytics[race].fewestPointsChoice || 0;
          gameEntry[`${race}_total`] = result.analytics[race].total;
          gameEntry[`${race}_finalBonus`] = result.analytics[race].finalBonus;
          gameEntry[`${race}_killed`] = result.analytics[race].killed;
          gameEntry[`${race}_swiadekJakubaPoints`] = result.analytics[race].swiadekJakubaPoints;
          gameEntry[`${race}_setPlacement`] = result.analytics[race].setPlacement;
          gameEntry[`${race}_passing`] = result.analytics[race].passing || 0;
        });
        gameEntry.scoreDiff = result.scoreDiff || 0;
        gameEntry.scoreDiff1st2nd = result.scoreDiff1st2nd || 0;
        return gameEntry;
      });

      setData(mappedResults);
    } catch (err) {
      console.error(err);
      clearInterval(progressInterval);
    } finally {
      setIsSimulating(false);
    }
  };

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
            <ChartBox title="2. General Selection by Player with Fewest Points" dataKeySuffix="fewestPointsChoice" data={data} />
            <ChartBox title="3. Łączne punkty zdobyte przez rasę w całej grze (Suma z 12 rund)" dataKeySuffix="total" data={data} />
            <ChartBox title="4. Final Phase Bonus Points" dataKeySuffix="finalBonus" data={data} />
            <ChartBox title="5. Punkty Świadka Jakuba" dataKeySuffix="swiadekJakubaPoints" data={data} />
            <ChartBox title="6. Pawns Killed by Jakub (Total)" dataKeySuffix="killed" data={data} />
            <ChartBox title="7. Set Placement Points (Total in Game)" dataKeySuffix="setPlacement" data={data} />
            <ScoreDiffChartBox title="8. Score Difference: 1st vs Last & 1st vs 2nd (Final)" data={data} />
            <ChartBox title="9. Punkty za kablowanie Jakubowi (Razem)" dataKeySuffix="passing" data={data} />
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
