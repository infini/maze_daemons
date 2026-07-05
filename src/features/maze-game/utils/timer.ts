export type TimerState = {
  startedAt: number | null;
  pausedAt: number | null;
  pausedDuration: number;
  finishedAt: number | null;
};

export function createTimerState(): TimerState {
  return {
    startedAt: null,
    pausedAt: null,
    pausedDuration: 0,
    finishedAt: null,
  };
}

export function startTimer(state: TimerState, now: number): TimerState {
  if (state.startedAt === null) {
    return { ...state, startedAt: now, pausedAt: null };
  }

  if (state.pausedAt !== null) {
    return {
      ...state,
      pausedDuration: state.pausedDuration + (now - state.pausedAt),
      pausedAt: null,
    };
  }

  return state;
}

export function togglePause(state: TimerState, now: number): TimerState {
  if (state.startedAt === null || state.finishedAt !== null) {
    return state;
  }

  if (state.pausedAt !== null) {
    return startTimer(state, now);
  }

  return { ...state, pausedAt: now };
}

export function finishTimer(state: TimerState, now: number): TimerState {
  if (state.startedAt === null) {
    return state;
  }

  return { ...state, finishedAt: now, pausedAt: null };
}

export function getElapsedMs(state: TimerState, now: number) {
  if (state.startedAt === null) {
    return 0;
  }

  const end = state.finishedAt ?? state.pausedAt ?? now;
  return Math.max(0, end - state.startedAt - state.pausedDuration);
}

export function formatElapsedTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}
