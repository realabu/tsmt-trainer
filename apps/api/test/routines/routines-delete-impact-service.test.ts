import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { SessionStatus, UserRole } from "@prisma/client";
import { RoutinesService } from "../../src/routines/routines.service";

type DeleteImpactHarnessConfig = {
  routine?: Record<string, unknown> | null;
  period?: Record<string, unknown> | null;
  counts?: {
    taskCount?: number;
    taskMediaLinkCount?: number;
    periodCount?: number;
    sessionCount?: number;
    sessionTaskTimingCount?: number;
    trainerAssignmentCount?: number;
    detachedBadgeAwardCount?: number;
  };
};

function createRoutineDeleteImpactLookupExpectation(routineId = "routine-1") {
  return {
    where: {
      id: routineId,
      child: {
        ownerId: "parent-1",
      },
    },
    include: {
      child: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      periods: {
        select: {
          id: true,
        },
      },
    },
  };
}

function createPeriodDeleteImpactLookupExpectation(periodId = "period-1") {
  return {
    where: {
      id: periodId,
      routine: {
        child: {
          ownerId: "parent-1",
        },
      },
    },
    include: {
      routine: {
        select: {
          id: true,
          name: true,
          child: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  };
}

function createRoutinesDeleteImpactHarness(config: DeleteImpactHarnessConfig = {}) {
  const counts = config.counts ?? {};
  const calls = {
    routineFindFirst: [] as Array<Record<string, unknown>>,
    routinePeriodFindFirst: [] as Array<Record<string, unknown>>,
    routineTaskCount: [] as Array<Record<string, unknown>>,
    taskMediaLinkCount: [] as Array<Record<string, unknown>>,
    routinePeriodCount: [] as Array<Record<string, unknown>>,
    sessionCount: [] as Array<Record<string, unknown>>,
    sessionTaskTimingCount: [] as Array<Record<string, unknown>>,
    routineAssignmentCount: [] as Array<Record<string, unknown>>,
    badgeAwardCount: [] as Array<Record<string, unknown>>,
  };

  const prisma = {
    routine: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.routineFindFirst.push(args);
        return "routine" in config
          ? config.routine
          : {
              id: "routine-1",
              name: "Esti feladatsor",
              child: {
                id: "child-1",
                firstName: "Anna",
                lastName: "Teszt",
              },
              periods: [
                { id: "period-1" },
                { id: "period-2" },
              ],
            };
      },
    },
    routineTask: {
      count: async (args: Record<string, unknown>) => {
        calls.routineTaskCount.push(args);
        return counts.taskCount ?? 4;
      },
    },
    taskMediaLink: {
      count: async (args: Record<string, unknown>) => {
        calls.taskMediaLinkCount.push(args);
        return counts.taskMediaLinkCount ?? 2;
      },
    },
    routinePeriod: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.routinePeriodFindFirst.push(args);
        return "period" in config
          ? config.period
          : {
              id: "period-1",
              name: "Heti blokk",
              routineId: "routine-1",
              startsOn: new Date("2026-05-04T00:00:00.000Z"),
              endsOn: new Date("2026-05-10T23:59:59.999Z"),
              routine: {
                id: "routine-1",
                name: "Esti feladatsor",
                child: {
                  firstName: "Anna",
                  lastName: "Teszt",
                },
              },
            };
      },
      count: async (args: Record<string, unknown>) => {
        calls.routinePeriodCount.push(args);
        return counts.periodCount ?? 3;
      },
    },
    session: {
      count: async (args: Record<string, unknown>) => {
        calls.sessionCount.push(args);
        return counts.sessionCount ?? 7;
      },
    },
    sessionTaskTiming: {
      count: async (args: Record<string, unknown>) => {
        calls.sessionTaskTimingCount.push(args);
        return counts.sessionTaskTimingCount ?? 21;
      },
    },
    routineAssignment: {
      count: async (args: Record<string, unknown>) => {
        calls.routineAssignmentCount.push(args);
        return counts.trainerAssignmentCount ?? 1;
      },
    },
    badgeAward: {
      count: async (args: Record<string, unknown>) => {
        calls.badgeAwardCount.push(args);
        return counts.detachedBadgeAwardCount ?? 5;
      },
    },
  };

  const service = new RoutinesService(prisma as never);
  const currentUser = {
    sub: "parent-1",
    email: "parent@example.com",
    role: UserRole.PARENT,
  };

  return { calls, currentUser, service };
}

test("getDeleteImpact throws NotFoundException when routine is missing or not owned", async () => {
  const { calls, currentUser, service } = createRoutinesDeleteImpactHarness({
    routine: null,
  });

  await assert.rejects(
    () => service.getDeleteImpact(currentUser, "routine-404"),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Feladatsor nem talalhato.");
      return true;
    },
  );

  assert.deepEqual(calls.routineFindFirst, [
    createRoutineDeleteImpactLookupExpectation("routine-404"),
  ]);
  assert.deepEqual(calls.routineTaskCount, []);
  assert.deepEqual(calls.taskMediaLinkCount, []);
  assert.deepEqual(calls.routinePeriodCount, []);
  assert.deepEqual(calls.sessionCount, []);
  assert.deepEqual(calls.sessionTaskTimingCount, []);
  assert.deepEqual(calls.routineAssignmentCount, []);
  assert.deepEqual(calls.badgeAwardCount, []);
});

test("getDeleteImpact uses current ownership lookup and dependent count queries", async () => {
  const { calls, currentUser, service } = createRoutinesDeleteImpactHarness();

  await service.getDeleteImpact(currentUser, "routine-1");

  assert.deepEqual(calls.routineFindFirst, [
    createRoutineDeleteImpactLookupExpectation(),
  ]);
  assert.deepEqual(calls.routineTaskCount, [
    { where: { routineId: "routine-1" } },
  ]);
  assert.deepEqual(calls.taskMediaLinkCount, [
    {
      where: {
        task: {
          routineId: "routine-1",
        },
      },
    },
  ]);
  assert.deepEqual(calls.routinePeriodCount, [
    { where: { routineId: "routine-1" } },
  ]);
  assert.deepEqual(calls.sessionCount, [
    { where: { routineId: "routine-1" } },
  ]);
  assert.deepEqual(calls.sessionTaskTimingCount, [
    {
      where: {
        session: {
          routineId: "routine-1",
        },
      },
    },
  ]);
  assert.deepEqual(calls.routineAssignmentCount, [
    { where: { routineId: "routine-1" } },
  ]);
  assert.deepEqual(calls.badgeAwardCount, [
    {
      where: {
        OR: [
          { routineId: "routine-1" },
          { periodId: { in: ["period-1", "period-2"] } },
        ],
      },
    },
  ]);
});

test("getDeleteImpact preserves badge detachment scope when routine has no periods", async () => {
  const { calls, currentUser, service } = createRoutinesDeleteImpactHarness({
    routine: {
      id: "routine-empty",
      name: "Ures feladatsor",
      child: {
        id: "child-1",
        firstName: "Bence",
        lastName: "Minta",
      },
      periods: [],
    },
  });

  await service.getDeleteImpact(currentUser, "routine-empty");

  assert.deepEqual(calls.badgeAwardCount, [
    {
      where: {
        OR: [
          { routineId: "routine-empty" },
        ],
      },
    },
  ]);
});

test("getDeleteImpact returns current routine delete impact shape from count values", async () => {
  const { currentUser, service } = createRoutinesDeleteImpactHarness({
    counts: {
      taskCount: 8,
      taskMediaLinkCount: 6,
      periodCount: 2,
      sessionCount: 9,
      sessionTaskTimingCount: 12,
      trainerAssignmentCount: 3,
      detachedBadgeAwardCount: 4,
    },
  });

  const result = await service.getDeleteImpact(currentUser, "routine-1");

  assert.deepEqual(result, {
    entityType: "routine",
    entityId: "routine-1",
    entityLabel: "Esti feladatsor",
    parentLabel: "Anna Teszt",
    deletes: [
      { label: "Feladat", count: 8 },
      { label: "Feladat media kapcsolat", count: 6 },
      { label: "Idoszak", count: 2 },
      { label: "Torna", count: 9 },
      { label: "Reszido bejegyzes", count: 12 },
      { label: "Trainer megosztas", count: 3 },
    ],
    detaches: [
      { label: "Badge megszerzes kapcsolat", count: 4 },
    ],
    notes: [
      "A badge megszerzesek gyermek szinten megmaradnak, de a torolt feladatsorhoz es idoszakokhoz valo kapcsolatuk megszunik.",
    ],
  });
});

test("getPeriodDeleteImpact throws NotFoundException when period is missing or not owned", async () => {
  const { calls, currentUser, service } = createRoutinesDeleteImpactHarness({
    period: null,
  });

  await assert.rejects(
    () => service.getPeriodDeleteImpact(currentUser, "period-404"),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Idoszak nem talalhato.");
      return true;
    },
  );

  assert.deepEqual(calls.routinePeriodFindFirst, [
    createPeriodDeleteImpactLookupExpectation("period-404"),
  ]);
  assert.deepEqual(calls.badgeAwardCount, []);
  assert.deepEqual(calls.sessionCount, []);
});

test("getPeriodDeleteImpact uses current ownership lookup and period-boundary count queries", async () => {
  const { calls, currentUser, service } = createRoutinesDeleteImpactHarness();

  await service.getPeriodDeleteImpact(currentUser, "period-1");

  assert.deepEqual(calls.routinePeriodFindFirst, [
    createPeriodDeleteImpactLookupExpectation(),
  ]);
  assert.deepEqual(calls.badgeAwardCount, [
    {
      where: { periodId: "period-1" },
    },
  ]);
  assert.deepEqual(calls.sessionCount, [
    {
      where: {
        routineId: "routine-1",
        status: SessionStatus.COMPLETED,
        completedAt: {
          gte: new Date("2026-05-04T00:00:00.000Z"),
          lte: new Date("2026-05-10T23:59:59.999Z"),
        },
      },
    },
  ]);
});

test("getPeriodDeleteImpact returns current period delete impact shape from count values", async () => {
  const { currentUser, service } = createRoutinesDeleteImpactHarness({
    period: {
      id: "period-2",
      name: null,
      routineId: "routine-2",
      startsOn: new Date("2026-06-01T00:00:00.000Z"),
      endsOn: new Date("2026-06-07T23:59:59.999Z"),
      routine: {
        id: "routine-2",
        name: "Reggeli feladatsor",
        child: {
          firstName: "Bence",
          lastName: "Minta",
        },
      },
    },
    counts: {
      detachedBadgeAwardCount: 3,
      sessionCount: 5,
    },
  });

  const result = await service.getPeriodDeleteImpact(currentUser, "period-2");

  assert.deepEqual(result, {
    entityType: "period",
    entityId: "period-2",
    entityLabel: "Nev nelkuli idoszak",
    parentLabel: "Bence Minta / Reggeli feladatsor",
    deletes: [],
    detaches: [
      { label: "Idoszakhoz kotott badge kapcsolat", count: 3 },
    ],
    notes: [
      "5 befejezett torna marad meg, de a torolt idoszak tobbe nem fog megjelenni a haladasi nezetekben.",
    ],
  });
});
