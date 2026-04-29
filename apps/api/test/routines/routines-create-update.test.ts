import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { RoutinesService } from "../../src/routines/routines.service";

type RoutineServiceHarnessConfig = {
  ownedChild?: { id: string } | null;
  routineById?: Record<string, unknown> | null;
  createResult?: Record<string, unknown>;
  updateResult?: Record<string, unknown>;
};

function createRoutinesServiceHarness(config: RoutineServiceHarnessConfig = {}) {
  const calls = {
    childFindFirst: [] as Array<Record<string, unknown>>,
    routineCreate: [] as Array<Record<string, unknown>>,
    routineFindFirst: [] as Array<Record<string, unknown>>,
    routineUpdate: [] as Array<Record<string, unknown>>,
  };

  const prisma = {
    child: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.childFindFirst.push(args);
        return "ownedChild" in config ? config.ownedChild : { id: "child-1" };
      },
    },
    routine: {
      create: async (args: Record<string, unknown>) => {
        calls.routineCreate.push(args);
        return (
          config.createResult ?? {
            id: "routine-1",
            childId: "child-1",
            name: "Reggeli torna",
            description: "Leiras",
            tasks: [],
            periods: [],
          }
        );
      },
      findFirst: async (args: Record<string, unknown>) => {
        calls.routineFindFirst.push(args);
        return "routineById" in config
          ? config.routineById
          : {
            id: "routine-1",
            childId: "child-1",
            child: { id: "child-1" },
            tasks: [],
            periods: [],
            sessions: [],
            _count: { sessions: 0 },
          };
      },
      update: async (args: Record<string, unknown>) => {
        calls.routineUpdate.push(args);
        return (
          config.updateResult ?? {
            id: "routine-1",
            name: "Frissitett nev",
            description: "Frissitett leiras",
          }
        );
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

test("create uses owned child lookup and expected scalar routine create data", async () => {
  const { calls, service, currentUser } = createRoutinesServiceHarness({
    createResult: {
      id: "routine-1",
      childId: "child-1",
      name: "Reggeli torna",
      description: "Leiras",
      tasks: [],
      periods: [
        {
          id: "period-1",
          name: "Heti blokk",
          startsOn: new Date("2026-05-01T00:00:00.000Z"),
          endsOn: new Date("2026-05-07T00:00:00.000Z"),
          weeklyTargetCount: 3,
        },
      ],
    },
  });

  const result = await service.create(currentUser, {
    childId: "child-1",
    name: "Reggeli torna",
    description: "Leiras",
    tasks: [],
    periods: [
      {
        name: "Heti blokk",
        startsOn: "2026-05-01",
        endsOn: "2026-05-07",
        weeklyTargetCount: 3,
      },
    ],
  });

  assert.deepEqual(calls.childFindFirst, [
    {
      where: {
        id: "child-1",
        ownerId: "parent-1",
      },
      select: { id: true },
    },
  ]);

  assert.equal(calls.routineCreate.length, 1);
  assert.deepEqual(calls.routineCreate[0], {
    data: {
      childId: "child-1",
      name: "Reggeli torna",
      description: "Leiras",
      tasks: {
        create: [],
      },
      periods: {
        create: [
          {
            name: "Heti blokk",
            startsOn: new Date("2026-05-01T00:00:00.000Z"),
            endsOn: new Date("2026-05-07T00:00:00.000Z"),
            weeklyTargetCount: 3,
          },
        ],
      },
    },
    include: {
      tasks: {
        include: {
          catalogTask: {
            include: {
              defaultSong: true,
              difficultyLevels: {
                orderBy: { sortOrder: "asc" },
              },
              mediaLinks: {
                orderBy: { sortOrder: "asc" },
                include: {
                  mediaAsset: true,
                },
              },
              equipmentLinks: {
                include: {
                  equipmentCatalogItem: {
                    include: {
                      iconMedia: true,
                    },
                  },
                },
              },
            },
          },
          catalogDifficultyLevel: true,
          song: {
            include: {
              audioMedia: true,
              videoMedia: true,
            },
          },
          customImageMedia: true,
          mediaLinks: {
            orderBy: { sortOrder: "asc" },
            include: {
              mediaAsset: true,
            },
          },
        },
      },
      periods: true,
    },
  });

  assert.deepEqual(result, {
    id: "routine-1",
    childId: "child-1",
    name: "Reggeli torna",
    description: "Leiras",
    tasks: [],
    periods: [
      {
        id: "period-1",
        name: "Heti blokk",
        startsOn: new Date("2026-05-01T00:00:00.000Z"),
        endsOn: new Date("2026-05-07T00:00:00.000Z"),
        weeklyTargetCount: 3,
      },
    ],
  });
});

test("create throws when child is not owned by current user", async () => {
  const { service, currentUser } = createRoutinesServiceHarness({
    ownedChild: null,
  });

  await assert.rejects(
    service.create(currentUser, {
      childId: "child-1",
      name: "Reggeli torna",
      description: "Leiras",
      tasks: [],
      periods: [],
    }),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "A gyerek nem talalhato ezen a fiokon.");
      return true;
    },
  );
});

test("update preserves getById ownership lookup and scalar update query", async () => {
  const { calls, service, currentUser } = createRoutinesServiceHarness({
    updateResult: {
      id: "routine-1",
      name: "Frissitett nev",
      description: "Frissitett leiras",
    },
  });

  const result = await service.update(currentUser, "routine-1", {
    name: "Frissitett nev",
    description: "Frissitett leiras",
  });

  assert.equal(calls.routineFindFirst.length, 1);
  assert.deepEqual(calls.routineFindFirst[0], {
    where: {
      id: "routine-1",
      child: {
        ownerId: "parent-1",
      },
    },
    include: {
      child: true,
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: {
          catalogTask: {
            include: {
              defaultSong: true,
              difficultyLevels: {
                orderBy: { sortOrder: "asc" },
              },
              mediaLinks: {
                orderBy: { sortOrder: "asc" },
                include: {
                  mediaAsset: true,
                },
              },
              equipmentLinks: {
                include: {
                  equipmentCatalogItem: {
                    include: {
                      iconMedia: true,
                    },
                  },
                },
              },
            },
          },
          catalogDifficultyLevel: true,
          song: {
            include: {
              audioMedia: true,
              videoMedia: true,
            },
          },
          customImageMedia: true,
          mediaLinks: {
            orderBy: { sortOrder: "asc" },
            include: {
              mediaAsset: true,
            },
          },
        },
      },
      periods: {
        orderBy: { startsOn: "asc" },
      },
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          taskTimings: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
  });

  assert.deepEqual(calls.routineUpdate, [
    {
      where: { id: "routine-1" },
      data: {
        name: "Frissitett nev",
        description: "Frissitett leiras",
      },
    },
  ]);

  assert.deepEqual(result, {
    id: "routine-1",
    name: "Frissitett nev",
    description: "Frissitett leiras",
  });
});

test("update throws when routine is not found through existing getById path", async () => {
  const { service, currentUser } = createRoutinesServiceHarness({
    routineById: null,
  });

  await assert.rejects(
    service.update(currentUser, "routine-404", {
      name: "Frissitett nev",
      description: "Frissitett leiras",
    }),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Feladatsor nem talalhato.");
      return true;
    },
  );
});
