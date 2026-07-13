export function ensurePlayerStats(player) {
  if (!player.stats) {
    player.stats = {
      races: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 },
      scores: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 },
      losses: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 },
      rambo: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 },
      witness: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 },
      final: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 },
      passing: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 },
      mercy: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 },
      killedByJakub: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 },
      setsPlayed: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 }
    };
  }
  return player.stats;
}

export function trackGeneralSelection(player, race) {
  if (!race) return;
  const stats = ensurePlayerStats(player);
  stats.races[race] = (stats.races[race] || 0) + 1;
}

export function trackPointsChange(player, race, pts, category) {
  if (!race || pts === 0) return;
  const stats = ensurePlayerStats(player);
  
  if (pts > 0) {
    stats.scores[race] = (stats.scores[race] || 0) + pts;
  } else {
    stats.losses[race] = (stats.losses[race] || 0) + Math.abs(pts);
  }
  
  if (category === 'rambo') {
    stats.rambo[race] = (stats.rambo[race] || 0) + pts;
  } else if (category === 'witness') {
    stats.witness[race] = (stats.witness[race] || 0) + pts;
  } else if (category === 'final') {
    stats.final[race] = (stats.final[race] || 0) + pts;
  } else if (category === 'passing') {
    stats.passing[race] = (stats.passing[race] || 0) + pts;
  } else if (category === 'mercy') {
    stats.mercy[race] = (stats.mercy[race] || 0) + pts;
  }
}

export function trackJakubKills(player, race, count) {
  if (!race || count <= 0) return;
  const stats = ensurePlayerStats(player);
  stats.killedByJakub[race] = (stats.killedByJakub[race] || 0) + count;
}

export function trackSetsPlayed(player, race, count = 1) {
  if (!race || count <= 0) return;
  const stats = ensurePlayerStats(player);
  stats.setsPlayed[race] = (stats.setsPlayed[race] || 0) + count;
}

