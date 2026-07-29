import { SimulationJobManager } from '../server/services/simulationJobManager.js';

const totalCount = parseInt(process.argv[2], 10) || 1000;

console.log(`=======================================================`);
console.log(`  MASAKRA na Starym Majdanie - Parallel Simulation CLI `);
console.log(`  Total Games: ${totalCount}`);
console.log(`=======================================================\n`);

const startTime = Date.now();
const job = SimulationJobManager.createJob({ count: totalCount });

const interval = setInterval(() => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const percent = ((job.completedGames / job.totalGames) * 100).toFixed(1);
  process.stdout.write(`\rProgress: [${job.completedGames}/${job.totalGames}] (${percent}%) in ${elapsed}s...`);

  if (job.status === 'completed' || job.status === 'failed') {
    clearInterval(interval);
    console.log('\n');

    if (job.status === 'failed') {
      console.error(`Simulation failed: ${job.error}`);
      process.exit(1);
    }

    const { report } = job;
    const durationSec = ((job.endTime - job.startTime) / 1000).toFixed(2);
    const speed = Math.round(job.totalGames / Math.max(0.1, Number(durationSec)));

    console.log(`-------------------------------------------------------`);
    console.log(`  SIMULATION COMPLETED in ${durationSec}s (${speed} games/sec)`);
    console.log(`  Workers Used: ${job.numWorkers}`);
    console.log(`  Total Magnetism Triggers: ${report.totalMagnetismCount}`);
    console.log(`  Band Imbalance Score: ${report.bandImbalanceScore}% (lower is better)`);
    console.log(`-------------------------------------------------------\n`);

    console.log(`Race Performance Summary:`);
    console.table(Object.entries(report.races).map(([race, stats]) => ({
      Band: race.toUpperCase(),
      'Win %': `${stats.winRate}%`,
      Wins: stats.wins,
      'Mean Pts': stats.meanScore,
      'StdDev Pts': stats.stdDevScore,
      'Min/Max': `${stats.minScore}/${stats.maxScore}`,
      'Killed': stats.totalKilled,
      'Swiadek Pts': stats.totalSwiadekPoints,
      'Mercy Pts': stats.totalMercyPoints
    })));

    process.exit(0);
  }
}, 100);
