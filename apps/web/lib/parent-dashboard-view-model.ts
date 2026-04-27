import {
  buildProgressSquares,
  getPeriodState,
  getSessionSortValue,
  pickCurrentWeek,
  pickRelevantPeriod,
  sumTargetSessions,
} from "./parent-dashboard-helpers";

type ChildRecordLike = {
  id: string;
  firstName: string;
  lastName: string;
};

type RoutineRecordLike = {
  id: string;
  childId: string;
  name?: string;
};

type SessionRecordLike = {
  id: string;
  childId: string;
  routineId: string;
  completedAt?: string | null;
  createdAt?: string;
  totalSeconds?: number | null;
  status?: string;
  routine: {
    id: string;
    name: string;
  };
};

type ProgressWeekLike = {
  weekStart: string;
  weekEnd: string;
  targetSessions: number;
  completedSessions: number;
  targetMet: boolean;
};

type ProgressPeriodLike = {
  id: string;
  name?: string | null;
  startsOn: string;
  endsOn: string;
  weeklyTargetCount: number;
  totalCompletedSessions: number;
  weeks: ProgressWeekLike[];
};

export function buildParentDashboardViewModel(input: {
  children: ChildRecordLike[];
  routines: RoutineRecordLike[];
  sessions: SessionRecordLike[];
  periods: ProgressPeriodLike[];
  selectedChildId: string;
  selectedRoutineId: string;
  selectedPeriodId: string;
  progressLoaded: boolean;
  loadedProgressRoutineId: string;
}) {
  const childRoutines = input.routines.filter((routine) => routine.childId === input.selectedChildId);

  const effectiveRoutineId =
    input.selectedRoutineId && childRoutines.some((routine) => routine.id === input.selectedRoutineId)
      ? input.selectedRoutineId
      : (childRoutines[0]?.id ?? "");

  const sortedSessions = [...input.sessions].sort(
    (a, b) => getSessionSortValue(b) - getSessionSortValue(a),
  );

  const selectedChild = input.children.find((child) => child.id === input.selectedChildId) ?? null;
  const selectedRoutine =
    childRoutines.find((routine) => routine.id === effectiveRoutineId) ?? null;

  const latestSessionsForChild = sortedSessions
    .filter((session) => session.childId === input.selectedChildId)
    .slice(0, 5);

  const selectedPeriod =
    input.periods.find((period) => period.id === input.selectedPeriodId) ??
    pickRelevantPeriod(input.periods).period;

  const periodState = getPeriodState(selectedPeriod);
  const currentWeek = pickCurrentWeek(selectedPeriod);
  const remainingThisWeek = currentWeek
    ? Math.max(0, currentWeek.targetSessions - currentWeek.completedSessions)
    : 0;
  const totalTargetInPeriod = selectedPeriod ? sumTargetSessions(selectedPeriod) : 0;
  const remainingInPeriod = selectedPeriod
    ? Math.max(0, totalTargetInPeriod - selectedPeriod.totalCompletedSessions)
    : 0;
  const weekImpossible =
    !!currentWeek &&
    new Date(currentWeek.weekEnd) < new Date() &&
    currentWeek.completedSessions < currentWeek.targetSessions;
  const periodImpossible =
    periodState === "Lezart idoszak" &&
    !!selectedPeriod &&
    selectedPeriod.totalCompletedSessions < totalTargetInPeriod;
  const weeklySquares = currentWeek
    ? buildProgressSquares(
        currentWeek.targetSessions,
        currentWeek.completedSessions,
        weekImpossible,
        "week",
      )
    : [];
  const periodSquares = selectedPeriod
    ? buildProgressSquares(
        totalTargetInPeriod,
        selectedPeriod.totalCompletedSessions,
        periodImpossible,
        "period",
      )
    : [];
  const isSelectedRoutineProgressReady =
    !effectiveRoutineId ||
    (input.progressLoaded && input.loadedProgressRoutineId === effectiveRoutineId);

  return {
    childRoutines,
    effectiveRoutineId,
    selectedChild,
    selectedRoutine,
    sortedSessions,
    latestSessionsForChild,
    selectedPeriod,
    periodState,
    currentWeek,
    remainingThisWeek,
    totalTargetInPeriod,
    remainingInPeriod,
    weekImpossible,
    periodImpossible,
    weeklySquares,
    periodSquares,
    isSelectedRoutineProgressReady,
  };
}
