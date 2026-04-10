type BadgeAwardIdentifierInput =
  | { type: "first-session" }
  | { type: "total-sessions"; threshold: number }
  | { type: "routine-record"; routineId: string; completedAt: Date }
  | { type: "weekly-goal"; routineId: string; periodId: string; weekStart: Date }
  | { type: "routine-sessions"; routineId: string; threshold: number }
  | { type: "distinct-routines"; threshold: number }
  | { type: "weekly-streak"; routineId: string; threshold: number; completedAt: Date }
  | { type: "period-target"; routineId: string; periodId: string }
  | { type: "task-completions"; threshold: number };

export function buildBadgeAwardIdentifiers(input: BadgeAwardIdentifierInput) {
  switch (input.type) {
    case "first-session":
      return {
        contextKey: "first-session",
        reason: "first-session",
      };
    case "total-sessions":
      return {
        contextKey: `total-sessions-${input.threshold}`,
        reason: `total-sessions-${input.threshold}`,
      };
    case "routine-record": {
      const iso = input.completedAt.toISOString();
      return {
        contextKey: `routine-record:${input.routineId}:${iso}`,
        reason: `routine-record-${iso}`,
      };
    }
    case "weekly-goal": {
      const iso = input.weekStart.toISOString();
      return {
        contextKey: `weekly-goal:${input.routineId}:${input.periodId}:${iso}`,
        reason: `weekly-goal-${iso}`,
      };
    }
    case "routine-sessions":
      return {
        contextKey: `routine-sessions:${input.routineId}:${input.threshold}`,
        reason: `routine-sessions-${input.threshold}`,
      };
    case "distinct-routines":
      return {
        contextKey: `distinct-routines:${input.threshold}`,
        reason: `distinct-routines-${input.threshold}`,
      };
    case "weekly-streak": {
      const iso = input.completedAt.toISOString();
      return {
        contextKey: `weekly-streak:${input.routineId}:${input.threshold}:${iso}`,
        reason: `weekly-streak-${input.threshold}-${iso}`,
      };
    }
    case "period-target":
      return {
        contextKey: `period-target:${input.routineId}:${input.periodId}`,
        reason: `period-target-${input.periodId}`,
      };
    case "task-completions":
      return {
        contextKey: `task-completions:${input.threshold}`,
        reason: `task-completions-${input.threshold}`,
      };
  }
}
