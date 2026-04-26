type ParentDashboardSessionLike = {
  completedAt?: string | null;
  createdAt?: string;
};

type ParentDashboardWeekLike = {
  weekStart: string;
  weekEnd: string;
  targetSessions: number;
  completedSessions: number;
  targetMet: boolean;
};

type ParentDashboardPeriodLike = {
  id: string;
  name?: string | null;
  startsOn: string;
  endsOn: string;
  weeklyTargetCount: number;
  totalCompletedSessions: number;
  weeks: ParentDashboardWeekLike[];
};

export type ParentDashboardProgressSquare = {
  key: string;
  state: "done" | "pending" | "missed";
};

export function getSessionSortValue(session: ParentDashboardSessionLike) {
  return new Date(session.completedAt ?? session.createdAt ?? 0).getTime();
}

export function getPeriodState(period: ParentDashboardPeriodLike | null) {
  if (!period) {
    return "Nincs idoszak" as const;
  }

  const today = new Date();
  const startsOn = new Date(period.startsOn);
  const endsOn = new Date(period.endsOn);

  if (today >= startsOn && today <= endsOn) {
    return "Aktiv idoszak" as const;
  }

  if (today < startsOn) {
    return "Kovetkezo idoszak" as const;
  }

  return "Lezart idoszak" as const;
}

export function formatDuration(totalSeconds?: number | null) {
  if (totalSeconds == null) {
    return "—";
  }

  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function sumTargetSessions(period: ParentDashboardPeriodLike) {
  return period.weeks.reduce((sum, week) => sum + week.targetSessions, 0);
}

export function pickRelevantPeriod(periods: ParentDashboardPeriodLike[]) {
  const today = new Date();
  const active = periods.find((period) => {
    const startsOn = new Date(period.startsOn);
    const endsOn = new Date(period.endsOn);
    return today >= startsOn && today <= endsOn;
  });

  if (active) {
    return { period: active, state: "Aktiv szakasz" as const };
  }

  const upcoming = [...periods]
    .filter((period) => new Date(period.startsOn) > today)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))[0];

  if (upcoming) {
    return { period: upcoming, state: "Kovetkezo szakasz" as const };
  }

  const latestPast = [...periods]
    .filter((period) => new Date(period.endsOn) < today)
    .sort((a, b) => b.endsOn.localeCompare(a.endsOn))[0];

  if (latestPast) {
    return { period: latestPast, state: "Lezart szakasz" as const };
  }

  return { period: periods[0] ?? null, state: "Nincs szakasz" as const };
}

export function pickCurrentWeek(period: ParentDashboardPeriodLike | null) {
  if (!period) {
    return null;
  }

  const today = new Date();
  const current = period.weeks.find((week) => {
    const weekStart = new Date(week.weekStart);
    const weekEnd = new Date(week.weekEnd);
    return today >= weekStart && today <= weekEnd;
  });

  if (current) {
    return current;
  }

  return period.weeks[0] ?? null;
}

export function buildProgressSquares(
  target: number,
  completed: number,
  impossible: boolean,
  prefix: string,
): ParentDashboardProgressSquare[] {
  return Array.from({ length: Math.max(0, target) }, (_, index) => ({
    key: `${prefix}-${index}`,
    state: index < completed ? "done" : impossible ? "missed" : "pending",
  }));
}
