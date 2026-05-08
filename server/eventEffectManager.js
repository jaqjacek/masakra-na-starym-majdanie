/**
 * Manager responsible for applying event effects to the game state.
 */
export class EventEffectManager {
  static RACE_MAP = {
    'V': 'vampire',
    'W': 'werewolf',
    'G': 'ghost',
    'B': 'bardak'
  };

  /**
   * Applies the effect of an event to Jakub's anger and returns a log of changes.
   * @param {Object} jakubInterface - Interface from GameEventPhaseManager.
   * @param {string} type - 'anger-plus' or 'anger-minus'.
   * @param {Object} value - Mapping of initials to values (e.g., { "W": 2 }).
   * @returns {string} Detailed log of changes.
   */
  static applyAngerEffect(jakubInterface, type, value) {
    if (!jakubInterface || !value) return "";

    const logs = [];
    const currentAngers = jakubInterface.getAnger();

    Object.entries(value).forEach(([initial, amount]) => {
      const raceName = this.RACE_MAP[initial];
      if (!raceName) return;

      const oldAnger = currentAngers[raceName] || 0;
      let newAnger = oldAnger;

      if (type === 'anger-plus') {
        newAnger = oldAnger + amount;
        jakubInterface.setAnger(raceName, newAnger);
      } else if (type === 'anger-minus') {
        newAnger = Math.max(0, oldAnger - amount);
        jakubInterface.setAnger(raceName, newAnger);
      }

      if (oldAnger !== newAnger) {
        logs.push(`${raceName}: ${oldAnger} -> ${newAnger}`);
      }
    });

    return logs.length > 0 ? `Anger changes: ${logs.join(', ')}` : "No anger changes occurred.";
  }

  /**
   * Applies the effect of an event to pawn limits and returns a log of changes.
   * @param {Object} setsInterface - Interface from GameEventPhaseManager.
   * @param {string} type - 'pawnsTotal-plus' or 'pawnsTotal-minus'.
   * @param {Object} value - Mapping of initials to values.
   * @returns {string} Detailed log of changes.
   */
  static applyPawnLimitEffect(setsInterface, type, value) {
    if (!setsInterface || !value) return "";

    const logs = [];
    const currentLimits = setsInterface.getLimits();

    Object.entries(value).forEach(([initial, amount]) => {
      const raceName = this.RACE_MAP[initial];
      if (!raceName) return;

      const oldLimit = currentLimits[raceName] || 0;
      let newLimit = oldLimit;

      if (type === 'pawnsTotal-plus') {
        newLimit = oldLimit + amount;
        setsInterface.setLimit(raceName, newLimit);
      } else if (type === 'pawnsTotal-minus') {
        newLimit = Math.max(0, oldLimit - amount);
        setsInterface.setLimit(raceName, newLimit);
      }

      if (oldLimit !== newLimit) {
        logs.push(`${raceName}: ${oldLimit} -> ${newLimit}`);
      }
    });

    return logs.length > 0 ? `Pawn limit changes: ${logs.join(', ')}` : "No pawn limit changes occurred.";
  }

  /**
   * Wipes pawns from specific sectors and penalizes generals.
   * @param {Object} gameData - The full game data.
   * @param {Array} sectors - Array of {x, y} coordinates.
   * @returns {string} Log of changes.
   */
  static applyWipeSectorsEffect(gameData, sectors) {
    if (!gameData || !sectors) return "";
    
    const logs = [];
    const penaltyMap = {}; // { playerName: pointsLost }

    sectors.forEach(target => {
      const region = gameData.regions.find(r => r.x === target.x && r.y === target.y);
      if (!region) return;

      Object.entries(region.pawns).forEach(([raceId, instances]) => {
        if (raceId === 'jakub') return; // Don't wipe Jakub
        
        const count = instances.length;
        if (count === 0) return;

        // Find general for this race
        const generalPlayer = gameData.players.find(p => p.generalOf === raceId);
        if (generalPlayer) {
          generalPlayer.points = Math.max(0, generalPlayer.points - count);
          penaltyMap[generalPlayer.name] = (penaltyMap[generalPlayer.name] || 0) + count;
        }

        // Remove pawns
        delete region.pawns[raceId];
        logs.push(`${count} ${raceId}s at (${target.x},${target.y})`);
      });
    });

    if (logs.length === 0) return "Wipe sectors: No pawns were affected.";

    const penaltyLogs = Object.entries(penaltyMap).map(([name, lost]) => `${name}: -${lost} pts`);
    return `Wipe sectors: Removed ${logs.join(', ')}. Penalties: ${penaltyLogs.join(', ')}`;
  }

  /**
   * Distributes extra sets to all players.
   * @param {Object} gameData - The full game data.
   * @param {number} count - Number of sets per player.
   * @returns {string} Log of changes.
   */
  static applySupportEffect(gameData, count) {
    if (!gameData || !gameData.players || !gameData.sets || !count) return "";

    let totalDistributed = 0;
    const sets = gameData.sets;
    
    // Helper to draw a set
    const drawSet = () => {
      if (!sets.drawPile || sets.drawPile.length === 0) {
        if (sets.discardPile && sets.discardPile.length > 0) {
          sets.drawPile = [...sets.discardPile];
          sets.discardPile = [];
        } else {
          return null;
        }
      }
      const randomIdx = Math.floor(Math.random() * sets.drawPile.length);
      return sets.drawPile.splice(randomIdx, 1)[0];
    };

    gameData.players.forEach(player => {
      for (let i = 0; i < count; i++) {
        const set = drawSet();
        if (set) {
          set.ownerId = player.id;
          if (!sets.heldSets) sets.heldSets = [];
          sets.heldSets.push(set);
          totalDistributed++;
        }
      }
    });

    return totalDistributed > 0 
      ? `Support: Distributed ${count} extra set(s) to each player (Total: ${totalDistributed}).`
      : "Support: No sets available to distribute.";
  }
}
