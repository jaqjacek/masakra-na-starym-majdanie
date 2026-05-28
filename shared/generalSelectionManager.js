/**
 * Strategic General Selection Manager for MASAKRA na Starym Majdanie.
 * Chooses a player's general dynamically based on hand sets, board state, and available pools.
 */
export class GeneralSelectionManager {
  /**
   * Chooses a general from the available pool based on strategic selection rules.
   * 
   * @param {Array<string>} availableGenerals - List of currently available generals (races)
   * @param {Array<Object>} playersSetHand - List of sets currently held by the player
   * @param {Array<Object>} regions - List of all board regions
   * @param {Object} [totalPool=null] - Optional global pawn pool configuration
   * @returns {string} The strategically chosen general
   */
  static chooseGeneral(availableGenerals, playersSetHand, regions, totalPool = null) {
    if (!Array.isArray(availableGenerals) || availableGenerals.length === 0) {
      return null;
    }

    // 1. Calculate pawns of each race currently in the player's hand
    let B = 0; // bardak
    let V = 0; // vampire
    let G = 0; // ghost
    let W = 0; // werewolf

    if (Array.isArray(playersSetHand)) {
      playersSetHand.forEach(set => {
        if (set && set.content) {
          B += set.content.bardak || set.content.B || 0;
          V += set.content.vampire || set.content.V || 0;
          G += set.content.ghost || set.content.G || 0;
          W += set.content.werewolf || set.content.W || 0;
        }
      });
    }

    // Helper: Determine if a region has no pawns of any kind (including RACES and jakub)
    const isRegionFree = (r) => {
      if (!r || !r.pawns) return true;
      return !Object.values(r.pawns).some(pList => pList && pList.length > 0);
    };

    // Calculate Jakub's current anger level for each race
    const anger = { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 };
    let maxAngerVal = 0;
    let maxAngerRace = null;

    if (Array.isArray(regions)) {
      const jakR = regions.find(r => r.pawns?.jakub?.length > 0);
      if (jakR && jakR.pawns.jakub[0]) {
        const jakub = jakR.pawns.jakub[0];
        anger.vampire = jakub.anger?.vampire || jakub.anger?.V || 0;
        anger.werewolf = jakub.anger?.werewolf || jakub.anger?.W || 0;
        anger.ghost = jakub.anger?.ghost || jakub.anger?.G || 0;
        anger.bardak = jakub.anger?.bardak || jakub.anger?.B || 0;

        Object.entries(anger).forEach(([race, val]) => {
          if (val > maxAngerVal) {
            maxAngerVal = val;
            maxAngerRace = race;
          }
        });
      }
    }

    // Determine if a race should be vetoed due to high anger
    const isVetoed = (race) => {
      if (!availableGenerals.includes(race)) return true;
      const othersAvailable = availableGenerals.filter(g => g !== race);
      if (othersAvailable.length === 0) return false; // Never veto the absolute last option

      const isHighestAnger = race === maxAngerRace && maxAngerVal > 0;
      const hasHighAnger = anger[race] >= 5;
      return isHighestAnger || hasHighAnger;
    };

    // Filter availableGenerals down to non-vetoed ones
    let nonVetoedGenerals = availableGenerals.filter(g => !isVetoed(g));
    if (nonVetoedGenerals.length === 0) {
      nonVetoedGenerals = availableGenerals;
    }

    // 2. Evaluate rules in order of availability and strength

    // --- 1. VAMPIRE ---
    // "I have have 3 vampires or more in hand and there are enough vampires in totalPool choose vampires."
    const placedVampires = Array.isArray(regions)
      ? regions.reduce((sum, r) => sum + (r.pawns?.vampire?.length || r.pawns?.V?.length || 0), 0)
      : 0;
    
    // Default to standard 10 vampires if pool configuration isn't provided
    const maxVampires = totalPool && typeof totalPool.vampire === 'number'
      ? totalPool.vampire
      : 10;

    const remainingVampiresInPool = maxVampires - placedVampires;
    const satisfiesVampire = V >= 3 && remainingVampiresInPool >= 3;

    if (satisfiesVampire && nonVetoedGenerals.includes('vampire')) {
      return 'vampire';
    }

    // --- 2. WEREWOLF ---
    // "if i have more werewolfs than ghost and there are three empty regions that are neighbors to regions with werewolfs choose werewolfs."
    const werewolfRegions = Array.isArray(regions)
      ? regions.filter(r => (r.pawns?.werewolf?.length || r.pawns?.W?.length || 0) > 0)
      : [];
    const werewolfRegionIds = new Set(werewolfRegions.map(r => r.id));
    
    const emptyRegions = Array.isArray(regions)
      ? regions.filter(isRegionFree)
      : [];
    
    const emptyNeighborsToWerewolves = emptyRegions.filter(r => 
      Array.isArray(r.neighbors) && r.neighbors.some(nId => werewolfRegionIds.has(nId))
    );
    const satisfiesWerewolf = W > G && emptyNeighborsToWerewolves.length >= 3;

    if (satisfiesWerewolf && nonVetoedGenerals.includes('werewolf')) {
      return 'werewolf';
    }

    // --- 3. GHOST ---
    // "If i have more ghosts than werewolfs and there are 3 or more free edge regions choose ghosts."
    const edgeRegions = Array.isArray(regions)
      ? regions.filter(r => r.x === 0 || r.x === 5 || r.y === 0 || r.y === 5)
      : [];
    const freeEdgeRegions = edgeRegions.filter(isRegionFree);
    const satisfiesGhost = G > W && freeEdgeRegions.length >= 3;

    if (satisfiesGhost && nonVetoedGenerals.includes('ghost')) {
      return 'ghost';
    }

    // --- 4. BARDAK ---
    // "If I have 4 times more bardaks on my current held sets than vampires or 2 times more than ghost or werewolfs. Choose bardaks."
    const satisfiesBardak = B > 0 && (
      (B >= 4 * V) ||
      (B >= 2 * G) ||
      (B >= 2 * W)
    );

    if (satisfiesBardak && nonVetoedGenerals.includes('bardak')) {
      return 'bardak';
    }

    // --- Fallback ---
    // "If no rule matches or the chosen general is not in nonVetoedGenerals, default to the first element in nonVetoedGenerals."
    return nonVetoedGenerals[0];
  }
}
