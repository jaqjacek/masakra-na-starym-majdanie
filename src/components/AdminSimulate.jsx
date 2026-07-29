import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { PAWN_TYPES } from '../constants/pawnTypes';
import { RACES } from '../constants/game';
import { SERVER_URL } from '../constants/constants';
import { useTranslation } from '../hooks/useTranslation';
import { useGameContext } from '../hooks/useGameContext';
import '../assets/css/admin.css';

const getRaceColor = (raceId) => PAWN_TYPES.find(p => p.id === raceId)?.color || '#ccc';

const getImbalanceBadgeClass = (score) => {
  if (score < 10) return 'badge-success';
  if (score <= 20) return 'badge-warning';
  return 'badge-danger';
};

const AdminSimulate = () => {
  const { t } = useTranslation();
  const { socket } = useGameContext();

  const [availableSets, setAvailableSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [gameCount, setGameCount] = useState(1000);

  const [isSimulating, setIsSimulating] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [completedGames, setCompletedGames] = useState(0);
  const [report, setReport] = useState(null);

  const fetchSets = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/sets`);
      const list = await res.json();
      setAvailableSets(list);
    } catch (err) {
      console.error('Failed to fetch sets list:', err);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data) => {
      if (currentJobId && data.jobId !== currentJobId) return;
      setProgress(data.progressPercent || 0);
      setCompletedGames(data.completedGames || 0);
    };

    const handleCompleted = (data) => {
      if (currentJobId && data.jobId !== currentJobId) return;
      setProgress(100);
      setCompletedGames(data.report?.totalGames || gameCount);
      setReport(data.report);
      setIsSimulating(false);
    };

    socket.on('simulation:progress', handleProgress);
    socket.on('simulation:completed', handleCompleted);

    return () => {
      socket.off('simulation:progress', handleProgress);
      socket.off('simulation:completed', handleCompleted);
    };
  }, [socket, currentJobId, gameCount]);

  const [elapsedSec, setElapsedSec] = useState(0.1);

  useEffect(() => {
    if (!isSimulating) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedSec(Math.max(0.1, Number(((Date.now() - start) / 1000).toFixed(1))));
    }, 200);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const startParallelSimulation = async () => {
    setIsSimulating(true);
    setProgress(0);
    setCompletedGames(0);
    setReport(null);
    setElapsedSec(0.1);

    try {
      const response = await fetch(`${SERVER_URL}/api/simulate/job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: gameCount,
          sets: selectedSet ? { name: selectedSet } : null
        })
      });
      const data = await response.json();
      if (data.jobId) {
        setCurrentJobId(data.jobId);
        pollJobStatus(data.jobId);
      }
    } catch (err) {
      console.error('Failed to start parallel simulation:', err);
      setIsSimulating(false);
    }
  };

  const pollJobStatus = (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/simulate/job/${jobId}`);
        const jobData = await res.json();

        setProgress(jobData.progressPercent || 0);
        setCompletedGames(jobData.completedGames || 0);

        if (jobData.status === 'completed') {
          clearInterval(pollInterval);
          setReport(jobData.report);
          setIsSimulating(false);
        } else if (jobData.status === 'failed') {
          clearInterval(pollInterval);
          setIsSimulating(false);
          console.error('Simulation job failed:', jobData.error);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 300);
  };

  const winRateChartData = report ? RACES.map(race => ({
    name: t(race).toUpperCase(),
    race,
    winRate: report.races[race]?.winRate || 0,
    wins: report.races[race]?.wins || 0,
    meanScore: report.races[race]?.meanScore || 0,
    stdDev: report.races[race]?.stdDevScore || 0,
    color: getRaceColor(race)
  })) : [];

  const gamesPerSec = isSimulating ? Math.round(completedGames / elapsedSec) : 0;

  return (
    <div className="admin-page-content">
      {/* Control Actions Bar */}
      <div className="admin-actions-bar simulation-controls">
        <div className="control-group">
          <label style={{ color: '#aaa', fontSize: '14px', marginRight: '8px' }}>
            {t('admin_simulate_set_label', { defaultValue: 'Game Set:' })}
          </label>
          <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)}>
            <option value="">{t('admin_sets_select', { defaultValue: 'Default Set Configuration' })}</option>
            {availableSets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label style={{ color: '#aaa', fontSize: '14px', marginRight: '8px' }}>
            {t('admin_simulate_count_label', { defaultValue: 'Monte Carlo Games:' })}
          </label>
          <select value={gameCount} onChange={(e) => setGameCount(Number(e.target.value))}>
            <option value={100}>100 {t('games', { defaultValue: 'Games' })}</option>
            <option value={1000}>1,000 {t('games', { defaultValue: 'Games' })}</option>
            <option value={5000}>5,000 {t('games', { defaultValue: 'Games' })}</option>
            <option value={10000}>10,000 {t('games', { defaultValue: 'Games' })}</option>
            <option value={50000}>50,000 {t('games', { defaultValue: 'Games' })}</option>
          </select>
        </div>

        <button 
          className="action-button upload-btn" 
          onClick={startParallelSimulation} 
          disabled={isSimulating}
          style={{ minWidth: '220px' }}
        >
          {isSimulating 
            ? t('admin_simulate_running_status', { defaultValue: `Simulating... (${progress}%)` }) 
            : t('admin_simulate_parallel_btn', { defaultValue: `⚡ Run ${gameCount.toLocaleString()} Games (Workers)` })}
        </button>
      </div>

      {/* Progress Bar */}
      {isSimulating && (
        <div className="simulation-progress-card">
          <div className="progress-header">
            <span className="progress-title">
              ⚡ {t('admin_simulate_progress_title', { defaultValue: 'Executing Worker Threads Batch Simulation' })}
            </span>
            <span className="progress-stats">
              {completedGames.toLocaleString()} / {gameCount.toLocaleString()} {t('games', { defaultValue: 'games' })} ({gamesPerSec} {t('games_per_sec', { defaultValue: 'games/sec' })})
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {/* Results Dashboard */}
      {report && (
        <div className="simulation-dashboard">
          {/* Header & Imbalance KPI */}
          <div className="simulation-summary-header">
            <div>
              <h2>{t('admin_simulate_results_title', { defaultValue: 'Simulation Analytics Report' })}</h2>
              <p style={{ color: '#bbb', marginTop: '4px' }}>
                {t('admin_simulate_analytics_summary', { count: report.totalGames.toLocaleString(), defaultValue: `Analyzed ${report.totalGames.toLocaleString()} game sessions across parallel worker threads` })}
              </p>
            </div>
            
            <div className="imbalance-kpi-badge">
              <span className="kpi-label">{t('admin_simulate_imbalance_score', { defaultValue: 'Band Imbalance Score' })}:</span>
              <span className={`kpi-badge ${getImbalanceBadgeClass(report.bandImbalanceScore)}`}>
                {report.bandImbalanceScore}%
              </span>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="kpi-cards-grid">
            <div className="kpi-card">
              <span className="kpi-card-title">{t('admin_simulate_kpi_games', { defaultValue: 'Total Games' })}</span>
              <span className="kpi-card-val">{report.totalGames.toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card-title">{t('admin_simulate_kpi_magnetism', { defaultValue: 'Magnetism Triggers' })}</span>
              <span className="kpi-card-val">{report.totalMagnetismCount.toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card-title">{t('admin_simulate_kpi_target_balance', { defaultValue: 'Ideal Balance / Band' })}</span>
              <span className="kpi-card-val" style={{ color: '#2ecc71' }}>25.0%</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-grid-two">
            {/* Win Rate Bar Chart */}
            <div className="simulation-chart-box">
              <h3>{t('admin_simulate_winrate_chart_title', { defaultValue: 'Band Win Rate (%) Distribution' })}</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={winRateChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#ccc" />
                    <YAxis stroke="#ccc" unit="%" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#333', border: '1px solid #666', borderRadius: '6px' }}
                      formatter={(val) => [`${val}%`, 'Win Rate']}
                    />
                    <Bar dataKey="winRate" name="Win Rate %">
                      {winRateChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mean Score vs StdDev Bar Chart */}
            <div className="simulation-chart-box">
              <h3>{t('admin_simulate_meanscore_chart_title', { defaultValue: 'Mean Score & Score Variance (StdDev)' })}</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={winRateChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#333', border: '1px solid #666', borderRadius: '6px' }}
                    />
                    <Legend />
                    <Bar dataKey="meanScore" fill="#3498db" name="Mean Final Score" />
                    <Bar dataKey="stdDev" fill="#e74c3c" name="StdDev Score Variance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Performance Table */}
          <div className="simulation-table-container">
            <h3 style={{ marginBottom: '12px', color: '#ffd54f' }}>
              {t('admin_simulate_table_title', { defaultValue: 'Detailed Band Breakdown' })}
            </h3>
            <table className="admin-events-table">
              <thead>
                <tr>
                  <th>{t('admin_simulate_hdr_band', { defaultValue: 'Band' })}</th>
                  <th>{t('admin_simulate_hdr_winrate', { defaultValue: 'Win Rate %' })}</th>
                  <th>{t('admin_simulate_hdr_wins', { defaultValue: 'Wins' })}</th>
                  <th>{t('admin_simulate_hdr_mean', { defaultValue: 'Mean Score' })}</th>
                  <th>{t('admin_simulate_hdr_stddev', { defaultValue: 'StdDev' })}</th>
                  <th>{t('admin_simulate_hdr_minmax', { defaultValue: 'Min / Max' })}</th>
                  <th>{t('admin_simulate_hdr_killed', { defaultValue: 'Pawns Killed' })}</th>
                  <th>{t('admin_simulate_hdr_swiadek', { defaultValue: 'Świadek Pts' })}</th>
                  <th>{t('admin_simulate_hdr_mercy', { defaultValue: 'Mercy Pts' })}</th>
                </tr>
              </thead>
              <tbody>
                {RACES.map(race => {
                  const rStats = report.races[race];
                  if (!rStats) return null;
                  return (
                    <tr key={race}>
                      <td style={{ fontWeight: 'bold', color: getRaceColor(race) }}>
                        {t(race).toUpperCase()}
                      </td>
                      <td>
                        <span className="badge-winrate" style={{ backgroundColor: getRaceColor(race) + '33', color: getRaceColor(race), border: `1px solid ${getRaceColor(race)}` }}>
                          {rStats.winRate}%
                        </span>
                      </td>
                      <td>{rStats.wins.toLocaleString()}</td>
                      <td>{rStats.meanScore}</td>
                      <td>±{rStats.stdDevScore}</td>
                      <td>{rStats.minScore} / {rStats.maxScore}</td>
                      <td>{rStats.totalKilled.toLocaleString()}</td>
                      <td>{rStats.totalSwiadekPoints.toLocaleString()}</td>
                      <td>{rStats.totalMercyPoints.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSimulate;
