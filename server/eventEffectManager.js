/**
 * Manager responsible for applying event effects to the game state.
 */
import { RACE_MAP, RACE_MAP_PL } from './eventConstants.js';
import { EventMoveEffects } from './eventMoveEffects.js';
import { EventTransformationEffects } from './eventTransformationEffects.js';

export class EventEffectManager {
  static RACE_MAP = RACE_MAP;
  static RACE_MAP_PL = RACE_MAP_PL;

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
        const racePl = this.RACE_MAP_PL[raceName] || raceName;
        logs.push(`${racePl}: ${oldAnger} -> ${newAnger}`);
      }
    });

    // Recalculate Range!
    const updatedAngers = jakubInterface.getAnger();
    let extraRange = 0;
    Object.values(updatedAngers).forEach(val => {
      if (val >= 10) {
        extraRange += 1;
      }
    });
    const newRange = Math.min(5, 1 + extraRange);
    jakubInterface.setRange(newRange);

    return logs.length > 0 ? `Zmiany furii: ${logs.join(', ')} (Zasięg zaktualizowany do ${newRange})` : "Brak zmian furii.";
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
        const racePl = this.RACE_MAP_PL[raceName] || raceName;
        logs.push(`${racePl}: ${oldLimit} -> ${newLimit}`);
      }
    });

    return logs.length > 0 ? `Zmiany limitów band: ${logs.join(', ')}` : "Brak zmian limitów band.";
  }

  /**
   * Applies the support event (adding sets to players).
   * @param {Object} setsInterface - Interface from GameEventPhaseManager.
   * @param {number} count - Number of sets to distribute per player.
   * @returns {string} Detailed log of changes.
   */
  static applySupportEffect(setsInterface, count) {
    if (!setsInterface) return "";

    const playerIds = setsInterface.getPlayerIds();
    let totalDistributed = 0;

    playerIds.forEach(playerId => {
      for (let i = 0; i < count; i++) {
        const success = setsInterface.drawSetForPlayer(playerId);
        if (success) {
          totalDistributed++;
        }
      }
    });

    return totalDistributed > 0 
      ? `Wsparcie: Rozdano po ${count} dodatkowym zestawie każdemu graczowi (Suma: ${totalDistributed}).`
      : "Wsparcie: Brak dostępnych zestawów do rozdania.";
  }

  /**
   * Moves pawns from one sector to another.
   * Delegates to EventMoveEffects.
   */
  static applyMoveEffect(gameData, value) {
    return EventMoveEffects.applyMoveEffect(gameData, value);
  }

  /**
   * Wipes all pawns from specific coordinates.
   * @param {Object} gameData - The full game data.
   * @param {Array<Object>} coordinatesList - Array of {x, y} coordinates.
   * @returns {string} Detailed log of changes.
   */
  static applyWipeSectorsEffect(gameData, coordinatesList) {
    if (!gameData || !coordinatesList || !Array.isArray(coordinatesList)) return "";

    const wipedLogs = [];
    let totalWiped = 0;

    coordinatesList.forEach(coord => {
      const region = gameData.regions.find(r => r.x === coord.x && r.y === coord.y);
      if (!region) return;

      const regionWipedStats = [];
      let regionWipedCount = 0;

      Object.entries(region.pawns).forEach(([raceId, instances]) => {
        if (raceId === 'jakub') return; // Don't wipe Jakub
        const count = instances.length;
        if (count === 0) return;

        delete region.pawns[raceId];
        const racePl = this.RACE_MAP_PL[raceId] || raceId;
        regionWipedStats.push(`${count} x ${racePl}`);
        regionWipedCount += count;
      });

      if (regionWipedCount > 0) {
        wipedLogs.push(`(${coord.x},${coord.y})[${regionWipedStats.join(', ')}]`);
        totalWiped += regionWipedCount;
      }
    });

    if (totalWiped === 0) {
      return "Wielkie Czyszczenie: Brak pionków na celowanych sektorach do wyeliminowania.";
    }

    return `Wielkie Czyszczenie: Wyeliminowano pionki na sektorach: ${wipedLogs.join(', ')} (Suma: ${totalWiped}).`;
  }

  /**
   * Applies the "transformation" event effect.
   * Delegates to EventTransformationEffects.
   */
  static applyTransformationEffect(gameData, value) {
    return EventTransformationEffects.applyTransformationEffect(gameData, value);
  }
}
