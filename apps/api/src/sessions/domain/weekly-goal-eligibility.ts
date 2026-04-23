import { getProRatedWeeklyTarget, getTotalTargetForPeriod } from "./session-week-boundaries";

type PeriodTargetInput = {
  startsOn: Date;
  endsOn: Date;
  weeklyTargetCount: number;
};

export function isWeeklyGoalMet(input: {
  completedInWeek: number;
  weekStart: Date;
  weekEnd: Date;
  period: PeriodTargetInput;
}) {
  const boundedStart = new Date(
    Math.max(input.weekStart.getTime(), input.period.startsOn.getTime()),
  );
  const boundedEnd = new Date(Math.min(input.weekEnd.getTime(), input.period.endsOn.getTime()));
  const proratedTarget = getProRatedWeeklyTarget(
    input.period.weeklyTargetCount,
    boundedStart,
    boundedEnd,
  );

  return input.completedInWeek >= proratedTarget;
}

export function isPeriodTargetMet(input: {
  completedInPeriod: number;
  period: PeriodTargetInput;
}) {
  const periodTarget = getTotalTargetForPeriod(input.period);
  return input.completedInPeriod >= periodTarget;
}
