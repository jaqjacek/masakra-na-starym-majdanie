export class Board {
  constructor(size = 6) {
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
    const reachable = new Set();
    const queue = [{ index: startIndex, dist: 0 }];
    const visited = new Set([startIndex]);
    
    while (queue.length > 0) {
      const { index, dist } = queue.shift();
      reachable.add(index);
      if (dist < range) {
        regions[index].neighbors.forEach(nIdx => {
          if (!visited.has(nIdx)) { 
            visited.add(nIdx); 
            queue.push({ index: nIdx, dist: dist + 1 }); 
          }
        });
      }
    }
    return Array.from(reachable);
  }

  static getDistance(r1, r2) {
    if (!r1 || !r2) return 999;
    return Math.max(Math.abs(r1.x - r2.x), Math.abs(r1.y - r2.y));
  }
}
