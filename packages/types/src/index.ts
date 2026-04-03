export type UserRole = "PARENT" | "TRAINER" | "ADMIN";

export type SubscriptionPlan = "FREE" | "PRO";
export type SubscriptionStatus = "FREE" | "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export type MediaKind = "IMAGE" | "AUDIO" | "VIDEO" | "EXTERNAL_LINK";

export interface ChildSummary {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
}

export interface RoutineSummary {
  id: string;
  childId: string;
  name: string;
  description?: string | null;
  taskCount: number;
  activePeriodCount: number;
}

export interface WeeklyGoalProgress {
  periodId: string;
  weekStart: string;
  weekEnd: string;
  targetSessions: number;
  completedSessions: number;
}
