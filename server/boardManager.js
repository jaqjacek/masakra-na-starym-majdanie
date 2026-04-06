import fs from 'fs';
import path from 'path';
import { RACES, DEFAULT_PLAYERS } from './constants.js';

export const createEmptyRegions = () => {
  const size = 5; const regions = [];
  for (let i = 0; i < size * size; i++) { regions.push({ id: i, x: i % size, y: Math.floor(i / size), neighbors: [], pawns: {} }); }
  regions.forEach(region => {
    const { x, y } = region;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx; const ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) region.neighbors.push(ny * size + nx);
      }
    }
  });
  const interior = regions.filter(r => r.x > 0 && r.x < 4 && r.y > 0 && r.y < 4).map(r => r.id);
  const rIdx = interior[Math.floor(Math.random() * interior.length)];
  regions[rIdx].pawns.jakub = [{ statuses: ['ENABLED'], speed: 1, range: 0, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];
  return regions;
};

export const getChebyshevDistance = (r1, r2) => { if (!r1 || !r2) return 999; return Math.max(Math.abs(r1.x - r2.x), Math.abs(r1.y - r2.y)); };

export const getRegionsInRange = (regions, startIndex, range) => {
  const inRange = new Set();
  const queue = [{ index: startIndex, dist: 0 }];
  const visited = new Set([startIndex]);

  while (queue.length > 0) {
    const { index, dist } = queue.shift();
    inRange.add(index); // Always include the current node in the range result
    if (dist < range) {
      regions[index].neighbors.forEach(nIdx => {
        if (!visited.has(nIdx)) {
          visited.add(nIdx);
          queue.push({ index: nIdx, dist: dist + 1 });
        }
      });
    }
  }
  return Array.from(inRange);
};

export const getBestTargetRegion = (candidateIndices, priorityRaces, regions) => {
  if (candidateIndices.length === 0) return null; let tied = candidateIndices;
  for (const race of priorityRaces) {
    let maxCount = -1; let nextTied = [];
    tied.forEach(rIdx => { const count = regions[rIdx].pawns[race]?.length || 0; if (count > maxCount) { maxCount = count; nextTied = [rIdx]; } else if (count === maxCount) { nextTied.push(rIdx); } });
    if (maxCount > 0) tied = nextTied; if (tied.length === 1) break;
  }
  const finalId = tied[0]; return priorityRaces.some(race => regions[finalId].pawns[race]?.length > 0) ? finalId : null;
};
