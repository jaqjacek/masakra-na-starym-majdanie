import { BOARD_SIZE, PAWN_SPEED, JAKUB_BASE_RANGE, emptyAnger } from './constants.js';
import { getRegionsInRange } from '../shared/boardGeometry.js';

export { getRegionsInRange };

export const createEmptyRegions = () => {
  const size = BOARD_SIZE; const regions = [];
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
  const edge = size - 1;
  const interior = regions.filter(r => r.x > 0 && r.x < edge && r.y > 0 && r.y < edge).map(r => r.id);
  const rIdx = interior[Math.floor(Math.random() * interior.length)];
  regions[rIdx].pawns.jakub = [{ statuses: ['ENABLED'], speed: PAWN_SPEED.jakub, range: JAKUB_BASE_RANGE, anger: emptyAnger() }];
  updateJakubDistance(regions);
  return regions;
};

export const updateJakubDistance = (regions) => {
  const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
  regions.forEach(r => {
    if (jakubRegion) {
      r.jakubDistance = Math.max(Math.abs(r.x - jakubRegion.x), Math.abs(r.y - jakubRegion.y));
    } else {
      r.jakubDistance = 999;
    }
  });
  return regions;
};


