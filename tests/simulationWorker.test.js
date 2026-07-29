import test from 'node:test';
import assert from 'node:assert';
import { SimulationJobManager, aggregateSimulationResults } from '../server/services/simulationJobManager.js';

test('aggregateSimulationResults - correctly calculates win rates and stats', () => {
  const mockRawResults = [
    {
      analytics: {
        vampire: { total: 20, setPlacement: 10, passing: 10 },
        werewolf: { total: 10, setPlacement: 10 },
        ghost: { total: 5 },
        bardak: { total: 0 }
      }
    },
    {
      analytics: {
        vampire: { total: 15 },
        werewolf: { total: 25, setPlacement: 25 },
        ghost: { total: 5 },
        bardak: { total: 0 }
      }
    }
  ];

  const report = aggregateSimulationResults(mockRawResults);

  assert.strictEqual(report.totalGames, 2);
  assert.strictEqual(report.races.vampire.wins, 1);
  assert.strictEqual(report.races.werewolf.wins, 1);
  assert.strictEqual(report.races.vampire.winRate, 50);
  assert.strictEqual(report.races.werewolf.winRate, 50);
  assert.strictEqual(report.races.ghost.winRate, 0);
  assert.strictEqual(report.races.bardak.winRate, 0);
});

test('SimulationJobManager - executes parallel job using Worker Threads', async () => {
  const job = SimulationJobManager.createJob({ count: 20 });
  assert.strictEqual(job.totalGames, 20);

  // Poll until completion
  await new Promise((resolve) => {
    const check = setInterval(() => {
      if (job.status === 'completed' || job.status === 'failed') {
        clearInterval(check);
        resolve();
      }
    }, 50);
  });

  assert.strictEqual(job.status, 'completed');
  assert.ok(job.report);
  assert.strictEqual(job.report.totalGames, 20);
  assert.ok(typeof job.report.bandImbalanceScore === 'number');
});
