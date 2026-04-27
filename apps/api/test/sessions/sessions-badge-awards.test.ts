import assert from "node:assert/strict";
import test from "node:test";
import {
  BadgeTriggerType,
  SessionStatus,
  UserRole,
} from "@prisma/client";
import { buildBadgeAwardIdentifiers } from "../../src/sessions/domain/badge-award-identifiers";
import { startOfWeek } from "../../src/sessions/domain/session-week-boundaries";
import { SessionsService } from "../../src/sessions/sessions.service";

type BadgeDefinitionLike = {
  id: string;
  triggerType: BadgeTriggerType;
  triggerConfig?: unknown;
};

type BadgeAwardTestConfig = {
  badgeDefinitions: BadgeDefinitionLike[];
  completedSessionsCount?: number;
  completedRoutineSessionsCount?: number;
  distinctCompletedRoutineCount?: number;
  completedTaskCount?: number;
  previousBestRecord?: { totalSeconds: number | null } | null;
  routine?: {
    id: string;
    periods: Array<{
      id: string;
      startsOn: Date;
      endsOn: Date;
      weeklyTargetCount: number;
    }>;
  } | null;
  completedInWeek?: number;
  completedInPeriod?: number;
};

function createSessionsServiceHarness(config: BadgeAwardTestConfig) {
  const badgeAwardCreates: Array<Record<string, unknown>> = [];
  const completedAtByRange = new Map<string, number>();

  if (config.completedInWeek !== undefined) {
    completedAtByRange.set("week", config.completedInWeek);
  }
  if (config.completedInPeriod !== undefined) {
    completedAtByRange.set("period", config.completedInPeriod);
  }

  const inProgressSession = {
    id: "session-1",
    childId: "child-1",
    routineId: "routine-1",
    status: SessionStatus.IN_PROGRESS,
    startedAt: new Date("2026-04-08T11:59:00.000Z"),
    createdAt: new Date("2026-04-08T11:59:00.000Z"),
    routine: {
      tasks: [],
    },
    taskTimings: [],
  };

  const prisma = {
    badgeDefinition: {
      findMany: async () => config.badgeDefinitions,
    },
    session: {
      findFirst: async (args: any) => {
        if (args?.where?.status === SessionStatus.IN_PROGRESS) {
          return inProgressSession;
        }

        if (args?.select?.totalSeconds) {
          return config.previousBestRecord ?? null;
        }

        if (args?.include?.routine?.include?.sessions) {
          return {
            id: "session-1",
            routine: {
              tasks: [],
              sessions: [],
            },
            taskTimings: [],
          };
        }

        return null;
      },
      update: async () => ({ id: "session-1" }),
      count: async (args: any) => {
        if (args?.where?.completedAt?.gte && args?.where?.completedAt?.lte) {
          const startsOn = args.where.completedAt.gte as Date;
          const endsOn = args.where.completedAt.lte as Date;

          if (
            config.routine?.periods[0] &&
            startsOn.getTime() === config.routine.periods[0].startsOn.getTime() &&
            endsOn.getTime() === config.routine.periods[0].endsOn.getTime()
          ) {
            return completedAtByRange.get("period") ?? 0;
          }

          return completedAtByRange.get("week") ?? 0;
        }

        if (args?.where?.routineId) {
          return config.completedRoutineSessionsCount ?? 0;
        }

        return config.completedSessionsCount ?? 0;
      },
      findMany: async (args: any) => {
        if (args?.distinct?.includes("routineId")) {
          return Array.from(
            { length: config.distinctCompletedRoutineCount ?? 0 },
            (_, index) => ({ routineId: `routine-${index}` }),
          );
        }

        return [];
      },
    },
    sessionTaskTiming: {
      count: async () => config.completedTaskCount ?? 0,
    },
    routine: {
      findUnique: async () => config.routine ?? null,
    },
    badgeAward: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        badgeAwardCreates.push(data);
        return data;
      },
    },
  };

  const service = new SessionsService(prisma as never);
  const currentUser = {
    sub: "parent-1",
    email: "parent@example.com",
    role: UserRole.PARENT,
  };

  return { service, currentUser, badgeAwardCreates };
}

test("finish awards FIRST_SESSION badge with expected contextKey and reason", async () => {
  const { service, currentUser, badgeAwardCreates } = createSessionsServiceHarness({
    badgeDefinitions: [
      {
        id: "badge-first",
        triggerType: BadgeTriggerType.FIRST_SESSION,
      },
    ],
    completedSessionsCount: 1,
  });

  await service.finish(currentUser, "session-1", {
    completedAt: "2026-04-08T12:00:00.000Z",
  });

  assert.equal(badgeAwardCreates.length, 1);
  assert.deepEqual(badgeAwardCreates[0], {
    childId: "child-1",
    routineId: "routine-1",
    badgeDefinitionId: "badge-first",
    contextKey: "first-session",
    reason: "first-session",
  });
});

test("finish awards TOTAL_SESSION_COUNT badge when threshold is met", async () => {
  const { service, currentUser, badgeAwardCreates } = createSessionsServiceHarness({
    badgeDefinitions: [
      {
        id: "badge-total",
        triggerType: BadgeTriggerType.TOTAL_SESSION_COUNT,
        triggerConfig: { threshold: 5 },
      },
    ],
    completedSessionsCount: 5,
  });

  await service.finish(currentUser, "session-1", {
    completedAt: "2026-04-08T12:00:00.000Z",
  });

  assert.equal(badgeAwardCreates.length, 1);
  assert.deepEqual(badgeAwardCreates[0], {
    childId: "child-1",
    routineId: "routine-1",
    badgeDefinitionId: "badge-total",
    contextKey: "total-sessions-5",
    reason: "total-sessions-5",
  });
});

test("finish does not award TOTAL_SESSION_COUNT badge when threshold is not met", async () => {
  const { service, currentUser, badgeAwardCreates } = createSessionsServiceHarness({
    badgeDefinitions: [
      {
        id: "badge-total",
        triggerType: BadgeTriggerType.TOTAL_SESSION_COUNT,
        triggerConfig: { threshold: 5 },
      },
    ],
    completedSessionsCount: 4,
  });

  await service.finish(currentUser, "session-1", {
    completedAt: "2026-04-08T12:00:00.000Z",
  });

  assert.equal(badgeAwardCreates.length, 0);
});

test("finish awards ROUTINE_RECORD badge when previous best is missing", async () => {
  const { service, currentUser, badgeAwardCreates } = createSessionsServiceHarness({
    badgeDefinitions: [
      {
        id: "badge-record",
        triggerType: BadgeTriggerType.ROUTINE_RECORD,
      },
    ],
    previousBestRecord: null,
  });

  await service.finish(currentUser, "session-1", {
    completedAt: "2026-04-08T12:00:00.000Z",
  });

  assert.equal(badgeAwardCreates.length, 1);
  assert.deepEqual(badgeAwardCreates[0], {
    childId: "child-1",
    routineId: "routine-1",
    badgeDefinitionId: "badge-record",
    contextKey: "routine-record:routine-1:2026-04-08T12:00:00.000Z",
    reason: "routine-record-2026-04-08T12:00:00.000Z",
  });
});

test("finish awards ROUTINE_RECORD badge when previous best totalSeconds is null", async () => {
  const { service, currentUser, badgeAwardCreates } = createSessionsServiceHarness({
    badgeDefinitions: [
      {
        id: "badge-record",
        triggerType: BadgeTriggerType.ROUTINE_RECORD,
      },
    ],
    previousBestRecord: { totalSeconds: null },
  });

  await service.finish(currentUser, "session-1", {
    completedAt: "2026-04-08T12:00:00.000Z",
  });

  assert.equal(badgeAwardCreates.length, 1);
});

test("finish does not award ROUTINE_RECORD badge when current time is not faster", async () => {
  const { service, currentUser, badgeAwardCreates } = createSessionsServiceHarness({
    badgeDefinitions: [
      {
        id: "badge-record",
        triggerType: BadgeTriggerType.ROUTINE_RECORD,
      },
    ],
    previousBestRecord: { totalSeconds: 60 },
  });

  await service.finish(currentUser, "session-1", {
    completedAt: "2026-04-08T12:00:00.000Z",
  });

  assert.equal(badgeAwardCreates.length, 0);
});

test("finish awards TASK_COMPLETION_COUNT badge when threshold is met", async () => {
  const { service, currentUser, badgeAwardCreates } = createSessionsServiceHarness({
    badgeDefinitions: [
      {
        id: "badge-task-count",
        triggerType: BadgeTriggerType.TASK_COMPLETION_COUNT,
        triggerConfig: { threshold: 10 },
      },
    ],
    completedTaskCount: 10,
  });

  await service.finish(currentUser, "session-1", {
    completedAt: "2026-04-08T12:00:00.000Z",
  });

  assert.equal(badgeAwardCreates.length, 1);
  assert.deepEqual(badgeAwardCreates[0], {
    childId: "child-1",
    routineId: "routine-1",
    badgeDefinitionId: "badge-task-count",
    contextKey: "task-completions:10",
    reason: "task-completions-10",
  });
});

test("finish awards WEEKLY_GOAL_COMPLETED badge with periodId when matching period exists and goal is met", async () => {
  const completedAt = new Date("2026-04-08T12:00:00.000Z");
  const { service, currentUser, badgeAwardCreates } = createSessionsServiceHarness({
    badgeDefinitions: [
      {
        id: "badge-weekly",
        triggerType: BadgeTriggerType.WEEKLY_GOAL_COMPLETED,
      },
    ],
    routine: {
      id: "routine-1",
      periods: [
        {
          id: "period-1",
          startsOn: new Date("2026-04-01T00:00:00.000Z"),
          endsOn: new Date("2026-04-30T23:59:59.999Z"),
          weeklyTargetCount: 3,
        },
      ],
    },
    completedInWeek: 3,
  });

  await service.finish(currentUser, "session-1", {
    completedAt: completedAt.toISOString(),
  });

  const identifiers = buildBadgeAwardIdentifiers({
    type: "weekly-goal",
    routineId: "routine-1",
    periodId: "period-1",
    weekStart: startOfWeek(completedAt),
  });
  assert.equal(badgeAwardCreates.length, 1);
  assert.deepEqual(badgeAwardCreates[0], {
    childId: "child-1",
    routineId: "routine-1",
    periodId: "period-1",
    badgeDefinitionId: "badge-weekly",
    contextKey: identifiers.contextKey,
    reason: identifiers.reason,
  });
});
