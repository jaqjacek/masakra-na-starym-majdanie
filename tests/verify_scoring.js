import { Scoring } from '../shared/scoring/scoring.js';

const regions = [];
for (let i = 0; i < 36; i++) {
  regions.push({
    id: i,
    x: i % 6,
    y: Math.floor(i / 6),
    neighbors: [],
    pawns: {}
  });
}

// Place Jakub at {x: 3, y: 1} -> id = 1 * 6 + 3 = 9
const jakubRegion = regions[9];
jakubRegion.pawns.jakub = [{
  statuses: ['ENABLED'],
  speed: 1,
  range: 1,
  anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 }
}];

// Initialize neighbors
regions.forEach(region => {
  const { x, y } = region;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < 6 && ny >= 0 && ny < 6) {
        region.neighbors.push(ny * 6 + nx);
      }
    }
  }
});

// Set target region at {x: 3, y: 2} -> id = 2 * 6 + 3 = 15
const targetRegion = regions[15];
targetRegion.jakubDistance = 1;

// Set content: 1 ghost
const setContent = {
  ghost: 1
};

const scores = Scoring.calculatePlacementPoints(regions, targetRegion, setContent);

console.log('--- USER SCENARIO TEST 2 ---');
console.log('Jakub at {x: 3, y: 1}');
console.log('Ghost placed at {x: 3, y: 2}');
console.log('Calculated Scores:', scores);
process.exit(0);
