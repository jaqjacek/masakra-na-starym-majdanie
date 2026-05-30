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
    if (gCount <= 0) return 0;
    
    const distToEdge = Math.min(
      targetRegion.x, 
      5 - targetRegion.x, 
      targetRegion.y, 
      5 - targetRegion.y
    );
    
    let perPawn = 2 - distToEdge;
    if (dist <= jakubRange) {
      perPawn -= 1;
    }
    
    return perPawn * gCount;
  }

  static findBestPlacement(regions, emptyRegions, placeableSets) {
    let best = null;
    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    const jakub = jakubRegion?.pawns.jakub[0];
    const jakubRange = jakub ? jakub.range : 0;
    
    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const dist = region.jakubDistance;
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
