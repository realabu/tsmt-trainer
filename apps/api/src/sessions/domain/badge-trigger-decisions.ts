export function shouldAwardFirstSessionBadge(completedSessionsCount: number) {
  return completedSessionsCount === 1;
}

export function shouldAwardTotalSessionCountBadge(
  completedSessionsCount: number,
  threshold: number,
) {
  return threshold > 0 && completedSessionsCount >= threshold;
}

export function shouldAwardRoutineSessionCountBadge(
  completedRoutineSessionsCount: number,
  threshold: number,
) {
  return threshold > 0 && completedRoutineSessionsCount >= threshold;
}

export function shouldAwardDistinctRoutineCountBadge(
  distinctCompletedRoutineCount: number,
  threshold: number,
) {
  return threshold > 0 && distinctCompletedRoutineCount >= threshold;
}

export function shouldAwardTaskCompletionCountBadge(
  completedTaskCount: number,
  threshold: number,
) {
  return threshold > 0 && completedTaskCount >= threshold;
}

export function shouldAwardRoutineRecordBadge(
  totalSeconds: number,
  previousBestTotalSeconds: number | null | undefined,
) {
  return previousBestTotalSeconds == null || totalSeconds < previousBestTotalSeconds;
}
