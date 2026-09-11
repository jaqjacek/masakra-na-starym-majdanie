import { regionXY } from './constants.js';

export function getRegionsInRange(regions, startIndex, range) {
  const inRange = new Set();
  const queue = [{ index: startIndex, dist: 0 }];
  const visited = new Set([startIndex]);

  while (queue.length > 0) {
    const { index, dist } = queue.shift();
    inRange.add(index);
    if (dist < range) {
      (regions[index]?.neighbors || []).forEach((nIdx) => {
        if (!visited.has(nIdx)) {
          visited.add(nIdx);
          queue.push({ index: nIdx, dist: dist + 1 });
        }
      });
    }
  }
  return Array.from(inRange);
}

export function chebyshevDistance(r1, r2) {
  if (!r1 || !r2) return 999;
  const a = regionXY(r1);
  const b = regionXY(r2);
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
