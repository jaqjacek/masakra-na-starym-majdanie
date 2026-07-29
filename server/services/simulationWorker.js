import { parentPort, workerData } from 'worker_threads';
import { runBasicSimulation } from './simulationService.js';

if (parentPort && workerData) {
  const { chunkId, numGames, setsConfig, _gameConfig, eventsConfig } = workerData;
  const results = [];
  const reportInterval = Math.max(1, Math.floor(numGames / 10));

  for (let i = 1; i <= numGames; i++) {
    let setName = null;
    let setsData = null;

    if (setsConfig) {
      if (typeof setsConfig === 'string') {
        setName = setsConfig;
      } else if (setsConfig.name && !setsConfig.drawPile && !setsConfig.items) {
        setName = setsConfig.name;
      } else {
        setsData = JSON.parse(JSON.stringify(setsConfig));
      }
    }

    const eventsClone = eventsConfig ? JSON.parse(JSON.stringify(eventsConfig)) : null;
    const result = runBasicSimulation(setName, setsData, eventsClone);
    results.push(result);

    if (i % reportInterval === 0 || i === numGames) {
      parentPort.postMessage({
        type: 'progress',
        chunkId,
        completedGames: i,
        totalGames: numGames
      });
    }
  }

  parentPort.postMessage({
    type: 'done',
    chunkId,
    results
  });
}
