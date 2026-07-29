import { Worker } from 'worker_threads';
import os from 'os';
import path from 'path';
import { RACES } from '../constants.js';

const jobs = new Map();

function calculateMean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculateStdDev(arr, mean) {
  if (arr.length <= 1) return 0;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

export function aggregateSimulationResults(rawResults) {
  const totalGames = rawResults.length;
  const raceStats = {};
  RACES.forEach(r => {
    raceStats[r] = {
      wins: 0,
      winRate: 0,
      scores: [],
      meanScore: 0,
      stdDevScore: 0,
      minScore: Infinity,
      maxScore: -Infinity,
      totalKilled: 0,
      totalSwiadekPoints: 0,
      totalMercyPoints: 0,
      totalSetPlacement: 0,
      totalPassing: 0
    };
  });

  let totalMagnetismCount = 0;

  const gameSeries = rawResults.slice(0, 100).map((result, idx) => {
    const gameEntry = { game: idx + 1 };
    RACES.forEach(race => {
      const raceData = result.analytics[race] || {};
      gameEntry[`${race}_afterR1`] = raceData.afterR1 || 0;
      gameEntry[`${race}_fewestPointsChoice`] = raceData.fewestPointsChoice || 0;
      gameEntry[`${race}_total`] = raceData.total || 0;
      gameEntry[`${race}_finalBonus`] = raceData.finalBonus || 0;
      gameEntry[`${race}_killed`] = raceData.killed || 0;
      gameEntry[`${race}_swiadekJakubaPoints`] = raceData.swiadekJakubaPoints || 0;
      gameEntry[`${race}_setPlacement`] = raceData.setPlacement || 0;
      gameEntry[`${race}_passing`] = raceData.passing || 0;
      gameEntry[`${race}_mercyPoints`] = raceData.mercyPoints || 0;
    });
    gameEntry.scoreDiff = result.scoreDiff || 0;
    gameEntry.scoreDiff1st2nd = result.scoreDiff1st2nd || 0;
    return gameEntry;
  });

  rawResults.forEach(r => {
    const { analytics } = r;
    if (analytics.magnetismCount) {
      totalMagnetismCount += analytics.magnetismCount;
    }

    // Determine winner
    let winnerRace = null;
    let highestTotal = -1;
    RACES.forEach(race => {
      const raceData = analytics[race];
      if (!raceData) return;
      const totalScore = raceData.total || 0;
      raceStats[race].scores.push(totalScore);
      raceStats[race].totalKilled += raceData.killed || 0;
      raceStats[race].totalSwiadekPoints += raceData.swiadekJakubaPoints || 0;
      raceStats[race].totalMercyPoints += raceData.mercyPoints || 0;
      raceStats[race].totalSetPlacement += raceData.setPlacement || 0;
      raceStats[race].totalPassing += raceData.passing || 0;

      if (totalScore > raceStats[race].maxScore) raceStats[race].maxScore = totalScore;
      if (totalScore < raceStats[race].minScore) raceStats[race].minScore = totalScore;

      if (totalScore > highestTotal) {
        highestTotal = totalScore;
        winnerRace = race;
      }
    });

    if (winnerRace) {
      raceStats[winnerRace].wins += 1;
    }
  });

  const winRates = [];
  RACES.forEach(r => {
    const stats = raceStats[r];
    stats.winRate = Number(((stats.wins / totalGames) * 100).toFixed(2));
    stats.meanScore = Number(calculateMean(stats.scores).toFixed(2));
    stats.stdDevScore = Number(calculateStdDev(stats.scores, stats.meanScore).toFixed(2));
    if (stats.minScore === Infinity) stats.minScore = 0;
    if (stats.maxScore === -Infinity) stats.maxScore = 0;
    delete stats.scores; // Clean up large array
    winRates.push(stats.winRate);
  });

  // Calculate Band Imbalance Score (stdDev of win percentages around 25%)
  const imbalanceScore = Number(calculateStdDev(winRates, 25).toFixed(2));

  return {
    totalGames,
    totalMagnetismCount,
    bandImbalanceScore: imbalanceScore,
    races: raceStats,
    gameSeries
  };
}

export class SimulationJobManager {
  static createJob({ count = 1000, setsConfig, gameConfig, eventsConfig, io }) {
    const jobId = `sim-job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const numWorkers = Math.min(os.cpus().length || 4, Math.ceil(count / 100));
    const chunkSize = Math.floor(count / numWorkers);

    const job = {
      id: jobId,
      status: 'queued',
      totalGames: count,
      completedGames: 0,
      startTime: Date.now(),
      endTime: null,
      numWorkers,
      workersDone: 0,
      rawResults: [],
      report: null
    };

    jobs.set(jobId, job);

    // Launch Workers
    job.status = 'running';
    const workerScript = path.join(process.cwd(), 'server', 'services', 'simulationWorker.js');

    for (let i = 0; i < numWorkers; i++) {
      const workerGames = (i === numWorkers - 1) ? (count - chunkSize * (numWorkers - 1)) : chunkSize;

      const worker = new Worker(workerScript, {
        workerData: {
          chunkId: i,
          numGames: workerGames,
          setsConfig,
          gameConfig,
          eventsConfig
        }
      });

      let workerCompletedGames = 0;

      worker.on('message', (msg) => {
        if (msg.type === 'progress') {
          const diff = msg.completedGames - workerCompletedGames;
          workerCompletedGames = msg.completedGames;
          job.completedGames += diff;

          const progressPercent = Number(((job.completedGames / job.totalGames) * 100).toFixed(1));
          if (io) {
            io.emit('simulation:progress', {
              jobId: job.id,
              completedGames: job.completedGames,
              totalGames: job.totalGames,
              progressPercent
            });
          }
        } else if (msg.type === 'done') {
          job.rawResults.push(...msg.results);
          job.workersDone += 1;

          if (job.workersDone === numWorkers) {
            job.status = 'completed';
            job.endTime = Date.now();
            job.report = aggregateSimulationResults(job.rawResults);
            delete job.rawResults;

            if (io) {
              io.emit('simulation:completed', {
                jobId: job.id,
                report: job.report,
                durationMs: job.endTime - job.startTime
              });
            }
          }
        }
      });

      worker.on('error', (err) => {
        console.error(`Simulation worker ${i} error:`, err);
        job.status = 'failed';
        job.error = err.message;
      });
    }

    return job;
  }

  static getJob(jobId) {
    return jobs.get(jobId) || null;
  }
}
