export class GhostScoring {
  /**
   * Calculates points for Ghost placement based on edge distance and Jakub range.
   * @param {Object} targetRegion - Region where the set is placed
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} jakubRange - Current movement range of Jakub
   * @param {number} gCount - Count of ghosts in the set
   * @returns {number} Points gained
   */
  static calculate(targetRegion, dist, jakubRange, gCount) {
    if (gCount <= 0 || !targetRegion) return 0;
    
    const rx = targetRegion.x !== undefined ? targetRegion.x : (targetRegion.id !== undefined ? targetRegion.id % 6 : 0);
    const ry = targetRegion.y !== undefined ? targetRegion.y : (targetRegion.id !== undefined ? Math.floor(targetRegion.id / 6) : 0);

    const distToEdge = Math.min(
      rx, 
      5 - rx, 
      ry, 
      5 - ry
    );
    
    let perPawn = 2 - distToEdge;
    if (dist <= 1) {
      perPawn -= 1;
    }
    
    return perPawn * gCount;
  }

  static findBestPlacement(regions, emptyRegions, placeableSets) {
    let best = null;
    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    const jakub = jakubRegion?.pawns.jakub[0];
    const jakubRange = jakub ? (jakub.range !== undefined ? Math.max(1, jakub.range) : 1) : 1;
    
    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const dist = jakubRegion 
          ? Math.max(
              Math.abs((region.x !== undefined ? region.x : region.id % 6) - (jakubRegion.x !== undefined ? jakubRegion.x : jakubRegion.id % 6)),
              Math.abs((region.y !== undefined ? region.y : Math.floor(region.id / 6)) - (jakubRegion.y !== undefined ? jakubRegion.y : Math.floor(jakubRegion.id / 6)))
            )
          : (region.jakubDistance !== undefined ? region.jakubDistance : 3);
        const pts = GhostScoring.calculate(region, dist, jakubRange, set.content.ghost || 0);
        
        if (!best) {
          best = { set, region, pts };
        } else {
          const currentDist = region.jakubDistance;
          const bestDist = best.region.jakubDistance;
            
          if (pts > best.pts) {
            best = { set, region, pts };
          } else if (pts === best.pts) {
            if (currentDist > bestDist) {
              best = { set, region, pts };
            } else if (currentDist === bestDist) {
              const currentDistToEdge = Math.min(region.x, 5 - region.x, region.y, 5 - region.y);
              const bestDistToEdge = Math.min(best.region.x, 5 - best.region.x, best.region.y, 5 - best.region.y);
              if (bestDistToEdge !== 0 && currentDistToEdge === 0) {
                best = { set, region, pts };
              }
            }
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
      const myCount = r.pawns?.ghost?.length || r.pawns?.G?.length || 0;
      if (myCount > 0) {
        let others = RACES.filter(race => race !== 'ghost').map(race => r.pawns?.[race]?.length || 0);
        const othersTotal = others.reduce((a, b) => a + b, 0);
        if (othersTotal === 0) {
          addedPoints += 2;
        } else {
          const maxOther = Math.max.apply(null, others);
          if (myCount > maxOther) {
            addedPoints += 1;
          }
        }
      }
    });
    return addedPoints;
  }
}
