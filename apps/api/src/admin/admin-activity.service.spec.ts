import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { AdminActivityService } from "./admin-activity.service";

function createPrismaMock() {
  return {
    routine: {
      findMany: async (_args: unknown): Promise<unknown> => [],
      findUnique: async (_args: unknown): Promise<unknown> => null,
    },
    session: {
      findMany: async (_args: unknown): Promise<unknown> => [],
      findUnique: async (_args: unknown): Promise<unknown> => null,
    },
  };
}

test("getRoutineDetail returns routine when found", async () => {
  const routine = { id: "routine-1", name: "Torna" };
  const prisma = createPrismaMock();
  prisma.routine.findUnique = async () => routine;

  const service = new AdminActivityService(prisma as never);

  const result = await service.getRoutineDetail({} as never, "routine-1");

  assert.equal(result, routine);
});

test("getRoutineDetail throws NotFoundException when not found", async () => {
  const service = new AdminActivityService(createPrismaMock() as never);

  await assert.rejects(
    () => service.getRoutineDetail({} as never, "missing-routine"),
    (error: unknown) =>
      error instanceof NotFoundException &&
      error.message === "Feladatsor nem talalhato.",
  );
});

test("getSessionDetail returns session when found", async () => {
  const session = { id: "session-1", totalSeconds: 42 };
  const prisma = createPrismaMock();
  prisma.session.findUnique = async () => session;

  const service = new AdminActivityService(prisma as never);

  const result = await service.getSessionDetail({} as never, "session-1");

  assert.equal(result, session);
});

test("getSessionDetail throws NotFoundException when not found", async () => {
  const service = new AdminActivityService(createPrismaMock() as never);

  await assert.rejects(
    () => service.getSessionDetail({} as never, "missing-session"),
    (error: unknown) =>
      error instanceof NotFoundException && error.message === "Session nem talalhato.",
  );
});

test("listRoutines passes childId-only where structure to Prisma", async () => {
  let receivedArgs: unknown;
  const prisma = createPrismaMock();
  prisma.routine.findMany = async (args: unknown) => {
    receivedArgs = args;
    return [];
  };

  const service = new AdminActivityService(prisma as never);
  await service.listRoutines({} as never, undefined, "child-1");

  assert.deepEqual(receivedArgs, {
    where: {
      childId: "child-1",
    },
    orderBy: { createdAt: "desc" },
    include: {
      child: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      tasks: {
        orderBy: { sortOrder: "asc" },
      },
      periods: {
        orderBy: { startsOn: "asc" },
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
  });
});

test("listRoutines passes parentId-only where structure to Prisma", async () => {
  let receivedArgs: unknown;
  const prisma = createPrismaMock();
  prisma.routine.findMany = async (args: unknown) => {
    receivedArgs = args;
    return [];
  };

  const service = new AdminActivityService(prisma as never);
  await service.listRoutines({} as never, "parent-1", undefined);

  assert.deepEqual((receivedArgs as { where: unknown }).where, {
    child: { ownerId: "parent-1" },
  });
});

test("listRoutines passes empty where structure when parentId and childId are undefined", async () => {
  let receivedArgs: unknown;
  const prisma = createPrismaMock();
  prisma.routine.findMany = async (args: unknown) => {
    receivedArgs = args;
    return [];
  };

  const service = new AdminActivityService(prisma as never);
  await service.listRoutines({} as never, undefined, undefined);

  assert.deepEqual((receivedArgs as { where: unknown }).where, {});
});

test("listSessions passes childId, routineId, and parentId where structure to Prisma", async () => {
  let receivedArgs: unknown;
  const prisma = createPrismaMock();
  prisma.session.findMany = async (args: unknown) => {
    receivedArgs = args;
    return [];
  };

  const service = new AdminActivityService(prisma as never);
  await service.listSessions({} as never, "parent-1", "child-1", "routine-1");

  assert.deepEqual(receivedArgs, {
    where: {
      childId: "child-1",
      routineId: "routine-1",
      child: { ownerId: "parent-1" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      child: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      routine: {
        select: {
          id: true,
          name: true,
        },
      },
      taskTimings: {
        orderBy: { sortOrder: "asc" },
      },
    },
    take: 50,
  });
});
