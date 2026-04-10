import {
  endOfWeek,
  getProRatedWeeklyTarget,
  startOfWeek,
} from "./session-week-boundaries";

type RoutinePeriod = {
  startsOn: Date;
  endsOn: Date;
  weeklyTargetCount: number;
};

export type WeeklyGoalSummary = {
  weekStart: Date;
  targetMet: boolean;
};

export function buildWeeklyGoalSummaries(input: {
  periods: RoutinePeriod[];
  completedSessionDates: Array<Date | null>;
  completedAt: Date;
}) {
  const { completedAt, completedSessionDates } = input;
  const periods = [...input.periods].sort((a, b) => a.startsOn.getTime() - b.startsOn.getTime());
  const weekSummaries: WeeklyGoalSummary[] = [];

  for (const period of periods) {
    let cursor = startOfWeek(period.startsOn);

    while (cursor <= period.endsOn) {
      const weekStart = new Date(cursor);
      const weekEnd = endOfWeek(weekStart);
      const boundedStart = new Date(Math.max(weekStart.getTime(), period.startsOn.getTime()));
      const boundedEnd = new Date(Math.min(weekEnd.getTime(), period.endsOn.getTime()));

      if (boundedStart > completedAt) {
        break;
      }

      const sessionsInWeek = completedSessionDates.filter((sessionCompletedAt) => {
        return (
          sessionCompletedAt != null &&
          sessionCompletedAt <= completedAt &&
          sessionCompletedAt >= boundedStart &&
          sessionCompletedAt <= boundedEnd
        );
      }).length;
      const target = getProRatedWeeklyTarget(period.weeklyTargetCount, boundedStart, boundedEnd);

      weekSummaries.push({
        weekStart,
        targetMet: sessionsInWeek >= target,
      });

      cursor = new Date(weekStart);
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  return weekSummaries;
}

export function getConsecutiveWeeklyGoalStreakFromSummaries(
  weekSummaries: WeeklyGoalSummary[],
  completedAt: Date,
) {
  const sorted = weekSummaries
    .filter((week) => week.weekStart <= completedAt)
    .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());

  let streak = 0;
  for (const week of sorted) {
    if (!week.targetMet) {
      break;
    }
    streak += 1;
  }

  return streak;
}
