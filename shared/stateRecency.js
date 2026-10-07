const PHASE_ORDER = {
  setup: 0,
  general_phase: 1,
  player_phase: 2,
  jakub_phase: 3,
  event_phase: 4,
  final_scoring: 5,
  'End Game': 6
};

export function stateRecency(data) {
  const round = Number(data?.currentRound) || 0;
  const phase = PHASE_ORDER[data?.phase] ?? -1;
  const ver = Number(data?.stateVersion) || 0;
  return { round, phase, ver };
}

/** True when `incoming` is older than `current` and must not overwrite it. */
export function isIncomingStateStale(incoming, current) {
  if (!incoming || !current) return false;
  const incomingReplay = Number(incoming.replayIndex) || 0;
  const currentReplay = Number(current.replayIndex) || 0;
  if (incomingReplay !== currentReplay) return incomingReplay < currentReplay;
  const a = stateRecency(incoming);
  const b = stateRecency(current);
  if (a.round !== b.round) return a.round < b.round;
  if (a.phase !== b.phase) return a.phase < b.phase;
  if (a.ver && b.ver) return a.ver < b.ver;
  return false;
}

export function bumpReplayIndex(data, step) {
  const index = (Number(data?.replayIndex) || 0) + 1;
  data.replayIndex = index;
  if (step) {
    if (!Array.isArray(data.replayLog)) data.replayLog = [];
    data.replayLog.push({ index, ...step });
    if (data.replayLog.length > 80) data.replayLog = data.replayLog.slice(-80);
  }
  return index;
}
