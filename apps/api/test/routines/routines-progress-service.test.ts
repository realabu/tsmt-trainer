import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { SessionStatus, UserRole } from "@prisma/client";
import { RoutinesService } from "../../src/routines/routines.service";

type ProgressHarnessConfig = {
  routine?: Record<string, unknown> | null;
};

function createProgressRoutineFindFirstExpectation(routineId = "routine-1") {
  return {
    where: {
      id: routineId,
      child: {
        ownerId: "parent-1",
      },
    },
    include: {
      periods: {
        orderBy: { startsOn: "asc" },
      },
      sessions: {
        where: {
          status: SessionStatus.COMPLETED,
          completedAt: {
            not: null,
          },
        },
        orderBy: {
          completedAt: "asc",
        },
        select: {
          id: true,
          completedAt: true,
          totalSeconds: true,
        },
      },
    },
  };
}

function createRoutinesProgressHarness(config: ProgressHarnessConfig = {}) {
  const calls = {
    routineFindFirst: [] as Array<Record<string, unknown>>,
  };

  const prisma = {
    routine: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.routineFindFirst.push(args);
        return "routine" in config ? config.routine : null;
      },
    },
  };

  const service = new RoutinesService(prisma as never, {} as never);
  const currentUser = {
    sub: "parent-1",
    email: "parent@example.com",
    role: UserRole.PARENT,
  };

  return { calls, currentUser, service };
}

test("getProgress uses current ownership filter and progress include query shape", async () => {
  const { calls, currentUser, service } = createRoutinesProgressHarness({
    routine: {
      id: "routine-1",
      periods: [],
      sessions: [],
    },
  });

  await service.getProgress(currentUser, "routine-1");

  assert.deepEqual(calls.routineFindFirst, [
    createProgressRoutineFindFirstExpectation(),
  ]);
});

test("getProgress throws NotFoundException when routine is missing or not owned", async () => {
  const { calls, currentUser, service } = createRoutinesProgressHarness({
    routine: null,
  });

  await assert.rejects(
    () => service.getProgress(currentUser, "routine-404"),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Feladatsor nem talalhato.");
      return true;
    },
  );

  assert.deepEqual(calls.routineFindFirst, [
    createProgressRoutineFindFirstExpectation("routine-404"),
  ]);
});

test("getProgress returns current response shape using existing progress calculation path", async () => {
  const period = {
    id: "period-1",
    name: "Heti blokk",
    startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
    endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
    weeklyTargetCount: 2,
  };
  const session = {
    id: "session-1",
    completedAt: new Date(2026, 3, 7, 10, 0, 0, 0),
    totalSeconds: 600,
  };
  const { currentUser, service } = createRoutinesProgressHarness({
    routine: {
      id: "routine-1",
      periods: [period],
      sessions: [session],
    },
  });

  const result = await service.getProgress(currentUser, "routine-1");

  assert.equal(result.routineId, "routine-1");
  assert.equal(result.periodCount, 1);
  assert.equal(result.periods.length, 1);
  assert.equal(result.periods[0]?.id, "period-1");
  assert.equal(result.periods[0]?.totalCompletedSessions, 1);
  assert.equal(result.periods[0]?.weeks.length, 1);
  assert.equal(result.periods[0]?.weeks[0]?.completedSessions, 1);
  assert.equal(result.periods[0]?.weeks[0]?.targetSessions, 2);
  assert.equal(result.periods[0]?.weeks[0]?.targetMet, false);
});
