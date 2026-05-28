export class BardakScoring {
  /**
   * Calculates points for Bardak placement based on distance to Jakub.
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} bCount - Count of bardaks in the set
   * @returns {number} Points gained
   */
  static calculate(dist, bCount) {
    if (bCount <= 0) return 0;
    return (dist <= 1) ? 0 : bCount;
  }

  static findBestPlacement(regions, emptyRegions, placeableSets) {
    let best = null;
    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const dist = region.jakubDistance;
        const pts = BardakScoring.calculate(dist, set.content.bardak || 0);
        if (!best) {
          best = { set, region, pts };
        } else {
          const bestDist = best.region.jakubDistance;
          if (dist > bestDist) {
            best = { set, region, pts };
          } else if (dist === bestDist && pts > best.pts) {
            best = { set, region, pts };
          }
        }
      });
    });
    return best;
  }

  static calculateFinal(regions) {
    const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];
    let addedPoints = 0;
    regions.forEach(r => {
      const myCount = r.pawns?.bardak?.length || r.pawns?.B?.length || 0;
      if (myCount > 0) {
        let othersCounts = RACES.filter(race => race !== 'bardak').map(race => r.pawns[race]?.length || 0);
        const maxOther = Math.max(...othersCounts);
        if (myCount > maxOther) {
          addedPoints += 1;
        }
      }
    });
    return addedPoints;
  }
}
