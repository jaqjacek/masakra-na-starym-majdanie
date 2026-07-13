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
  static chooseGeneral(availableGenerals, playersSetHand, regions, _totalPool = null) {
    if (!Array.isArray(availableGenerals) || availableGenerals.length === 0) {
      return null;
    }

    // 1. Calculate pawns of each race currently in the player's hand
    const handCounts = { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 };
    if (Array.isArray(playersSetHand)) {
      playersSetHand.forEach(set => {
        if (set && set.content) {
          handCounts.vampire += set.content.vampire || set.content.V || 0;
          handCounts.werewolf += set.content.werewolf || set.content.W || 0;
          handCounts.ghost += set.content.ghost || set.content.G || 0;
          handCounts.bardak += set.content.bardak || set.content.B || 0;
        }
      });
    }

    // 2. Calculate Jakub's current anger level for each race
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

    // 3. Determine fitness for each available general
    const fitness = {};
    availableGenerals.forEach(race => {
      let fitVal = 0;
      
      // Hand potential: how many pawns of this race do we have in hand?
      // Weighting based on difficulty & value of each race's points:
      const multiplier = race === 'vampire' ? 2.5 : race === 'werewolf' ? 1.5 : race === 'ghost' ? 2.0 : 1.0;
      fitVal += handCounts[race] * multiplier;

      // Jakub threat avoidance: deduct points if Jakub is angry at our race
      fitVal -= anger[race] * 2.0;
      if (race === maxAngerRace && maxAngerVal > 0) {
        fitVal -= 5.0; // additional penalty for being main target
      }

      // Board presence: factor in existing pawns of this race already on the board
      let onBoard = 0;
      if (Array.isArray(regions)) {
        regions.forEach(r => {
          onBoard += r.pawns[race]?.length || 0;
        });
      }
      fitVal += onBoard * (race === 'vampire' ? 1.0 : race === 'werewolf' ? 1.0 : race === 'ghost' ? 0.5 : 0.5);

      fitness[race] = fitVal;
    });

    // Select the race with highest fitness
    let bestRace = availableGenerals[0];
    let maxFitness = -Infinity;
    availableGenerals.forEach(race => {
      if (fitness[race] > maxFitness) {
        maxFitness = fitness[race];
        bestRace = race;
      }
    });

    return bestRace;
  }
}
