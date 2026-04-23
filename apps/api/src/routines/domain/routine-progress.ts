type RoutineProgressPeriodInput = {
  id: string;
  name: string | null;
  startsOn: Date;
  endsOn: Date;
  weeklyTargetCount: number;
};

type RoutineProgressSessionInput = {
  completedAt: Date | null;
};

export function calculateRoutineProgressPeriods(input: {
  periods: RoutineProgressPeriodInput[];
  sessions: RoutineProgressSessionInput[];
}) {
  return input.periods.map((period) => {
    const sessionsInPeriod = input.sessions.filter((session) => {
      const completedAt = session.completedAt;
      return completedAt && completedAt >= period.startsOn && completedAt <= period.endsOn;
    });

    const weeks = buildWeeklyBuckets(period.startsOn, period.endsOn).map((bucket) => {
      const completedSessions = sessionsInPeriod.filter((session) => {
        const completedAt = session.completedAt;
        return completedAt && completedAt >= bucket.weekStart && completedAt <= bucket.weekEnd;
      }).length;
      const targetSessions = getProRatedWeeklyTarget(
        period.weeklyTargetCount,
        bucket.weekStart,
        bucket.weekEnd,
      );

      return {
        weekStart: bucket.weekStart.toISOString(),
        weekEnd: bucket.weekEnd.toISOString(),
        targetSessions,
        completedSessions,
        targetMet: completedSessions >= targetSessions,
      };
    });

    return {
      id: period.id,
      name: period.name,
      startsOn: period.startsOn,
      endsOn: period.endsOn,
      weeklyTargetCount: period.weeklyTargetCount,
      totalCompletedSessions: sessionsInPeriod.length,
      weeks,
    };
  });
}

function buildWeeklyBuckets(startsOn: Date, endsOn: Date) {
  const buckets: Array<{ weekStart: Date; weekEnd: Date }> = [];
  let cursor = startOfWeek(startsOn);

  while (cursor <= endsOn) {
    const bucketStart = new Date(Math.max(cursor.getTime(), startsOn.getTime()));
    const rawWeekEnd = endOfWeek(cursor);
    const bucketEnd = new Date(Math.min(rawWeekEnd.getTime(), endsOn.getTime()));
    buckets.push({
      weekStart: bucketStart,
      weekEnd: bucketEnd,
    });
    cursor = addDays(endOfWeek(cursor), 1);
  }

  return buckets;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  start.setDate(start.getDate() + 6);
  start.setHours(23, 59, 59, 999);
  return start;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getProRatedWeeklyTarget(weeklyTargetCount: number, weekStart: Date, weekEnd: Date) {
  const coveredDays = getInclusiveDayCount(weekStart, weekEnd);
  const rawTarget = (weeklyTargetCount * coveredDays) / 7;
  return Math.round(rawTarget);
}

function getInclusiveDayCount(start: Date, end: Date) {
  const normalizedStart = new Date(start);
  const normalizedEnd = new Date(end);
  normalizedStart.setHours(0, 0, 0, 0);
  normalizedEnd.setHours(0, 0, 0, 0);

  const diffMs = normalizedEnd.getTime() - normalizedStart.getTime();
  return Math.max(1, Math.floor(diffMs / 86_400_000) + 1);
}
