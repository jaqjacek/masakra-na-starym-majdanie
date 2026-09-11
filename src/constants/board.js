import { BOARD_SIZE } from '../../shared/constants.js';
import { getRegionsInRange } from '../../shared/boardGeometry.js';

export class Board {
  constructor(size = BOARD_SIZE) {
    this.size = size;
  }

  generateEmpty() {
    const regions = [];
    for (let i = 0; i < this.size * this.size; i++) {
      regions.push({ 
        id: i, 
        x: i % this.size, 
        y: Math.floor(i / this.size), 
        neighbors: [], 
        pawns: {} 
      });
    }
    
    // Calculate neighbors for each region
    regions.forEach(region => {
      const { x, y } = region;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
            region.neighbors.push(ny * this.size + nx);
          }
        }
      }
    });
    
    return regions;
  }

  static getReachableRegions(regions, startIndex, range) {
    return getRegionsInRange(regions, startIndex, range);
  }

  static updateJakubDistance(regions) {
    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    regions.forEach(r => {
      if (jakubRegion) {
        r.jakubDistance = Math.max(Math.abs(r.x - jakubRegion.x), Math.abs(r.y - jakubRegion.y));
      } else {
        r.jakubDistance = 999;
      }
    });
    return regions;
  }
}
