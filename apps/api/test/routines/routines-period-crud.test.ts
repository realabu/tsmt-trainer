import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { RoutinesService } from "../../src/routines/routines.service";

type RoutinePeriodHarnessConfig = {
  ownedRoutine?: { id: string; childId: string } | null;
  ownedPeriod?: { id: string; routineId: string } | null;
  createResult?: Record<string, unknown>;
  updateResult?: Record<string, unknown>;
  deleteResult?: Record<string, unknown>;
};

function createRoutinesPeriodHarness(config: RoutinePeriodHarnessConfig = {}) {
  const calls = {
    routineFindFirst: [] as Array<Record<string, unknown>>,
    routinePeriodFindFirst: [] as Array<Record<string, unknown>>,
    routinePeriodCreate: [] as Array<Record<string, unknown>>,
    routinePeriodUpdate: [] as Array<Record<string, unknown>>,
    routinePeriodDelete: [] as Array<Record<string, unknown>>,
  };

  const prisma = {
    routine: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.routineFindFirst.push(args);
        return "ownedRoutine" in config
          ? config.ownedRoutine
          : {
              id: "routine-1",
              childId: "child-1",
            };
      },
    },
    routinePeriod: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.routinePeriodFindFirst.push(args);
        return "ownedPeriod" in config
          ? config.ownedPeriod
          : {
              id: "period-1",
              routineId: "routine-1",
            };
      },
      create: async (args: Record<string, unknown>) => {
        calls.routinePeriodCreate.push(args);
        return (
          config.createResult ?? {
            id: "period-1",
            routineId: "routine-1",
            name: "Tavaszi blokk",
            startsOn: new Date("2026-05-01T00:00:00.000Z"),
            endsOn: new Date("2026-05-21T00:00:00.000Z"),
            weeklyTargetCount: 3,
          }
        );
      },
      update: async (args: Record<string, unknown>) => {
        calls.routinePeriodUpdate.push(args);
        return (
          config.updateResult ?? {
            id: "period-1",
            routineId: "routine-1",
            name: "Frissitett blokk",
            startsOn: new Date("2026-06-01T00:00:00.000Z"),
            endsOn: new Date("2026-06-28T00:00:00.000Z"),
            weeklyTargetCount: 4,
          }
        );
      },
      delete: async (args: Record<string, unknown>) => {
        calls.routinePeriodDelete.push(args);
        return config.deleteResult ?? { id: "period-1" };
      },
    },
  };

  const service = new RoutinesService(prisma as never);
  const currentUser = {
    sub: "parent-1",
    email: "parent@example.com",
    role: UserRole.PARENT,
  };

  return { calls, service, currentUser };
}

test("createPeriod uses owned routine lookup and expected Prisma create query shape", async () => {
  const { calls, service, currentUser } = createRoutinesPeriodHarness();

  const result = await service.createPeriod(currentUser, "routine-1", {
    name: "Tavaszi blokk",
    startsOn: "2026-05-01",
    endsOn: "2026-05-21",
    weeklyTargetCount: 3,
  });

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
        child: {
          ownerId: "parent-1",
        },
      },
      select: {
        id: true,
        childId: true,
      },
    },
  ]);

  assert.deepEqual(calls.routinePeriodCreate, [
    {
      data: {
        routineId: "routine-1",
        name: "Tavaszi blokk",
        startsOn: new Date("2026-05-01T00:00:00.000Z"),
        endsOn: new Date("2026-05-21T00:00:00.000Z"),
        weeklyTargetCount: 3,
      },
    },
  ]);

  assert.deepEqual(result, {
    id: "period-1",
    routineId: "routine-1",
    name: "Tavaszi blokk",
    startsOn: new Date("2026-05-01T00:00:00.000Z"),
    endsOn: new Date("2026-05-21T00:00:00.000Z"),
    weeklyTargetCount: 3,
  });
});

test("createPeriod throws when routine is not owned by current user", async () => {
  const { service, currentUser } = createRoutinesPeriodHarness({
    ownedRoutine: null,
  });

  await assert.rejects(
    service.createPeriod(currentUser, "routine-404", {
      name: "Tavaszi blokk",
      startsOn: "2026-05-01",
      endsOn: "2026-05-21",
      weeklyTargetCount: 3,
    }),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Feladatsor nem talalhato.");
      return true;
    },
  );
});

test("updatePeriod uses owned period lookup and expected Prisma update query shape", async () => {
  const { calls, service, currentUser } = createRoutinesPeriodHarness();

  const result = await service.updatePeriod(currentUser, "period-1", {
    name: "Frissitett blokk",
    startsOn: "2026-06-01",
    endsOn: "2026-06-28",
    weeklyTargetCount: 4,
  });

  assert.deepEqual(calls.routinePeriodFindFirst, [
    {
      where: {
        id: "period-1",
        routine: {
          child: {
            ownerId: "parent-1",
          },
        },
      },
      select: {
        id: true,
        routineId: true,
      },
    },
  ]);

  assert.deepEqual(calls.routinePeriodUpdate, [
    {
      where: { id: "period-1" },
      data: {
        name: "Frissitett blokk",
        startsOn: new Date("2026-06-01T00:00:00.000Z"),
        endsOn: new Date("2026-06-28T00:00:00.000Z"),
        weeklyTargetCount: 4,
      },
    },
  ]);

  assert.deepEqual(result, {
    id: "period-1",
    routineId: "routine-1",
    name: "Frissitett blokk",
    startsOn: new Date("2026-06-01T00:00:00.000Z"),
    endsOn: new Date("2026-06-28T00:00:00.000Z"),
    weeklyTargetCount: 4,
  });
});

test("updatePeriod throws when period is not owned by current user", async () => {
  const { service, currentUser } = createRoutinesPeriodHarness({
    ownedPeriod: null,
  });

  await assert.rejects(
    service.updatePeriod(currentUser, "period-404", {
      name: "Frissitett blokk",
      startsOn: "2026-06-01",
      endsOn: "2026-06-28",
      weeklyTargetCount: 4,
    }),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Idoszak nem talalhato.");
      return true;
    },
  );
});

test("removePeriod uses owned period lookup and Prisma delete before returning success", async () => {
  const { calls, service, currentUser } = createRoutinesPeriodHarness();

  const result = await service.removePeriod(currentUser, "period-1");

  assert.deepEqual(calls.routinePeriodFindFirst, [
    {
      where: {
        id: "period-1",
        routine: {
          child: {
            ownerId: "parent-1",
          },
        },
      },
      select: {
        id: true,
        routineId: true,
      },
    },
  ]);

  assert.deepEqual(calls.routinePeriodDelete, [
    {
      where: { id: "period-1" },
    },
  ]);

  assert.deepEqual(result, { success: true });
});
