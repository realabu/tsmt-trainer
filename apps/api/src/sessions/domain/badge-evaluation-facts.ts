export interface BadgeEvaluationFacts {
  completedSessionsCount: number;
  completedRoutineSessionsCount: number;
  distinctCompletedRoutineCount: number;
  completedTaskCount: number;
  previousBestTotalSeconds?: number | null;
  routine: {
    id: string;
    periods: Array<{
      id: string;
      startsOn: Date;
      endsOn: Date;
      weeklyTargetCount: number;
    }>;
  } | null;
}

export function buildBadgeEvaluationFacts(input: BadgeEvaluationFacts): BadgeEvaluationFacts {
  return {
    completedSessionsCount: input.completedSessionsCount,
    completedRoutineSessionsCount: input.completedRoutineSessionsCount,
    distinctCompletedRoutineCount: input.distinctCompletedRoutineCount,
    completedTaskCount: input.completedTaskCount,
    previousBestTotalSeconds: input.previousBestTotalSeconds,
    routine: input.routine
      ? {
          id: input.routine.id,
          periods: [...input.routine.periods],
        }
      : null,
  };
}
