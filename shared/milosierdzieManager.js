import { RACES, MERCY_DIVISOR } from './constants.js';

export class MilosierdzieManager {
  /**
   * Applies the "Jakub's Mercy" logic.
   * If there are anger points remaining on Jakub at the end of the Jakub Phase,
   * half of these points (rounded up) are transferred to the player who is currently
   * the general of the corresponding race. The remaining points stay on Jakub's anger track.
   * 
   * @param {Object} jakub - The Jakub pawn object, containing anger track: { vampire, werewolf, ghost, bardak }
   * @param {Array} players - Array of players in the game, where each player has generalOf and points fields
   * @returns {Array} List of point rewards awarded to players: [{ race, points, playerName, playerId }]
   */
  static applyMercy(jakub, players) {
    const rewards = [];

    RACES.forEach(race => {
      const anger = jakub.anger[race] || 0;
      if (anger > 0) {
        const pointsToAdd = Math.ceil(anger / MERCY_DIVISOR);
        const remainingAnger = anger - pointsToAdd;

        const general = players.find(p => p.generalOf === race);
        if (general) {
          general.points += pointsToAdd;
          rewards.push({
            race,
            points: pointsToAdd,
            playerName: `P${general.id}`,
            playerId: general.id
          });
        }

        jakub.anger[race] = remainingAnger;
      }
    });

    return rewards;
  }
}
