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
    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const dist = jakubRegion 
          ? Math.max(
              Math.abs((region.x !== undefined ? region.x : region.id % 6) - (jakubRegion.x !== undefined ? jakubRegion.x : jakubRegion.id % 6)),
              Math.abs((region.y !== undefined ? region.y : Math.floor(region.id / 6)) - (jakubRegion.y !== undefined ? jakubRegion.y : Math.floor(jakubRegion.id / 6)))
            )
          : (region.jakubDistance !== undefined ? region.jakubDistance : 3);
        const pts = BardakScoring.calculate(dist, set.content.bardak || 0);
        if (!best) {
          best = { set, region, pts, dist };
        } else {
          if (dist > best.dist) {
            best = { set, region, pts, dist };
          } else if (dist === best.dist && pts > best.pts) {
            best = { set, region, pts, dist };
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
        let othersCounts = RACES.filter(race => race !== 'bardak').map(race => r.pawns?.[race]?.length || 0);
        const maxOther = Math.max.apply(null, othersCounts);
        if (myCount > maxOther) {
          addedPoints += 1;
        }
      }
    });
    return addedPoints;
  }
}
