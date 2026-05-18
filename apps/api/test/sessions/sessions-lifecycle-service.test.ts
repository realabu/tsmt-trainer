import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { SessionStatus, UserRole } from "@prisma/client";
import { SessionsService } from "../../src/sessions/sessions.service";

type SessionFindFirstArgs = Record<string, any>;
type SessionUpdateArgs = Record<string, any>;

function createCurrentUser() {
  return {
    sub: "parent-1",
    email: "parent@example.com",
    role: UserRole.PARENT,
  };
}

function createFinishHarness(input: {
  activeSession?: Record<string, any> | null;
  sessionDetail?: Record<string, any>;
}) {
  const sessionFindFirstCalls: SessionFindFirstArgs[] = [];
  const sessionUpdateCalls: SessionUpdateArgs[] = [];
  const badgeDefinitionFindManyCalls: Array<Record<string, any>> = [];

  const sessionDetail = input.sessionDetail ?? {
    id: "session-1",
    routine: {
      tasks: [],
      sessions: [],
    },
    taskTimings: [],
  };

  const prisma = {
    badgeDefinition: {
      findMany: async (args: Record<string, any>) => {
        badgeDefinitionFindManyCalls.push(args);
        return [];
      },
    },
    session: {
      findFirst: async (args: SessionFindFirstArgs) => {
        sessionFindFirstCalls.push(args);

        if (args?.where?.status === SessionStatus.IN_PROGRESS) {
          return input.activeSession ?? null;
        }

        if (args?.select?.totalSeconds) {
          return null;
        }

        if (args?.include?.routine?.include?.sessions) {
          return sessionDetail;
        }

        return null;
      },
      update: async (args: SessionUpdateArgs) => {
        sessionUpdateCalls.push(args);
        return { id: args.where.id };
      },
      count: async () => 0,
      findMany: async () => [],
    },
    sessionTaskTiming: {
      count: async () => 0,
    },
    routine: {
      findUnique: async () => null,
    },
    badgeAward: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, any> }) => data,
    },
  };

  return {
    service: new SessionsService(prisma as never),
    currentUser: createCurrentUser(),
    sessionFindFirstCalls,
    sessionUpdateCalls,
    badgeDefinitionFindManyCalls,
    sessionDetail,
  };
}

test("finish validates active session ownership, completes session, evaluates badges, and returns getById response", async () => {
  const completedAt = new Date("2026-04-08T12:00:00.000Z");
  const activeSession = {
    id: "session-1",
    childId: "child-1",
    routineId: "routine-1",
    status: SessionStatus.IN_PROGRESS,
    startedAt: new Date("2026-04-08T11:58:30.000Z"),
    createdAt: new Date("2026-04-08T11:00:00.000Z"),
    routine: {
      tasks: [],
    },
    taskTimings: [],
  };
  const { service, currentUser, sessionFindFirstCalls, sessionUpdateCalls, badgeDefinitionFindManyCalls, sessionDetail } =
    createFinishHarness({ activeSession });

  const result = await service.finish(currentUser, "session-1", {
    completedAt: completedAt.toISOString(),
    notes: "great work",
  });

  assert.deepEqual(sessionFindFirstCalls[0], {
    where: {
      id: "session-1",
      status: SessionStatus.IN_PROGRESS,
      child: {
        ownerId: "parent-1",
      },
    },
    include: {
      routine: {
        include: {
          tasks: true,
        },
      },
      taskTimings: true,
    },
  });
  assert.deepEqual(sessionUpdateCalls[0], {
    where: { id: "session-1" },
    data: {
      status: SessionStatus.COMPLETED,
      completedAt,
      totalSeconds: 90,
      notes: "great work",
    },
  });
  assert.deepEqual(badgeDefinitionFindManyCalls[0], {
    where: {
      isActive: true,
    },
  });
  assert.equal(sessionFindFirstCalls.length, 3);
  assert.equal(result, sessionDetail);
});

test("finish falls back to createdAt when startedAt is null for totalSeconds", async () => {
  const completedAt = new Date("2026-04-08T12:00:00.000Z");
  const { service, currentUser, sessionUpdateCalls } = createFinishHarness({
    activeSession: {
      id: "session-1",
      childId: "child-1",
      routineId: "routine-1",
      status: SessionStatus.IN_PROGRESS,
      startedAt: null,
      createdAt: new Date("2026-04-08T11:59:00.000Z"),
      routine: {
        tasks: [],
      },
      taskTimings: [],
    },
  });

  await service.finish(currentUser, "session-1", {
    completedAt: completedAt.toISOString(),
  });

  assert.equal(sessionUpdateCalls[0]?.data?.totalSeconds, 60);
});

test("finish preserves not-found behavior for missing or not-owned active session", async () => {
  const { service, currentUser, sessionFindFirstCalls, sessionUpdateCalls, badgeDefinitionFindManyCalls } =
    createFinishHarness({ activeSession: null });

  await assert.rejects(
    () =>
      service.finish(currentUser, "session-1", {
        completedAt: "2026-04-08T12:00:00.000Z",
      }),
    (error) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Aktiv session nem talalhato.");
      return true;
    },
  );

  assert.deepEqual(sessionFindFirstCalls[0], {
    where: {
      id: "session-1",
      status: SessionStatus.IN_PROGRESS,
      child: {
        ownerId: "parent-1",
      },
    },
    include: {
      routine: {
        include: {
          tasks: true,
        },
      },
      taskTimings: true,
    },
  });
  assert.equal(sessionUpdateCalls.length, 0);
  assert.equal(badgeDefinitionFindManyCalls.length, 0);
});
