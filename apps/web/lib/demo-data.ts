import type { ChildSummary, RoutineSummary, WeeklyGoalProgress } from "@tsmt/types";

export const demoChildren: ChildSummary[] = [
  {
    id: "child-bende",
    firstName: "Bende",
    lastName: "Szabo",
  },
  {
    id: "child-luca",
    firstName: "Luca",
    lastName: "Minta",
  },
];

export const demoRoutines: RoutineSummary[] = [
  {
    id: "routine-1",
    childId: "child-bende",
    name: "TSMT 1. feladatsor",
    description: "A jelenlegi prototipusbol atemelt indulocsomag.",
    taskCount: 16,
    activePeriodCount: 2,
  },
  {
    id: "routine-2",
    childId: "child-bende",
    name: "Roviditett esti rutin",
    description: "Gyorsabb gyakorlashoz, alacsonyabb terhelessel.",
    taskCount: 6,
    activePeriodCount: 1,
  },
];

export const demoWeeklyProgress: WeeklyGoalProgress[] = [
  {
    periodId: "period-1",
    weekStart: "2026-04-01",
    weekEnd: "2026-04-07",
    targetSessions: 3,
    completedSessions: 2,
  },
  {
    periodId: "period-1",
    weekStart: "2026-04-08",
    weekEnd: "2026-04-14",
    targetSessions: 3,
    completedSessions: 3,
  },
];
