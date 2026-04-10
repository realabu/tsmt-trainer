export function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  start.setDate(start.getDate() + 6);
  start.setHours(23, 59, 59, 999);
  return start;
}

export function getInclusiveDayCount(start: Date, end: Date) {
  const normalizedStart = new Date(start);
  const normalizedEnd = new Date(end);
  normalizedStart.setHours(0, 0, 0, 0);
  normalizedEnd.setHours(0, 0, 0, 0);

  const diffMs = normalizedEnd.getTime() - normalizedStart.getTime();
  return Math.max(1, Math.floor(diffMs / 86_400_000) + 1);
}

export function getProRatedWeeklyTarget(weeklyTargetCount: number, weekStart: Date, weekEnd: Date) {
  const coveredDays = getInclusiveDayCount(weekStart, weekEnd);
  const rawTarget = (weeklyTargetCount * coveredDays) / 7;
  return Math.round(rawTarget);
}
