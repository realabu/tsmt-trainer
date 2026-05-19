import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SessionStatus, UserRole } from "@prisma/client";
import { SessionsService } from "../../src/sessions/sessions.service";

type SessionFindFirstArgs = Record<string, any>;
type SessionUpdateArgs = Record<string, any>;
type SessionTaskTimingCreateArgs = Record<string, any>;
type BadgeEvaluationArgs = {
  childId: string;
  routineId: string;
  totalSeconds: number;
  completedAt: Date;
};

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
  const badgeEvaluationCalls: BadgeEvaluationArgs[] = [];

  const sessionDetail = input.sessionDetail ?? {
    id: "session-1",
    routine: {
      tasks: [],
      sessions: [],
    },
    taskTimings: [],
  };

  const prisma = {
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
    },
  };
  const sessionBadgeAwardService = {
    evaluateBadges: async (
      childId: string,
      routineId: string,
      totalSeconds: number,
      completedAt: Date,
    ) => {
      badgeEvaluationCalls.push({ childId, routineId, totalSeconds, completedAt });
    },
  };

  return {
    service: new SessionsService(prisma as never, sessionBadgeAwardService as never),
    currentUser: createCurrentUser(),
    sessionFindFirstCalls,
    sessionUpdateCalls,
    badgeEvaluationCalls,
    sessionDetail,
  };
}

function createCompleteTaskHarness(input: {
  activeSession?: Record<string, any> | null;
  sessionDetail?: Record<string, any>;
}) {
  const sessionFindFirstCalls: SessionFindFirstArgs[] = [];
  const sessionUpdateCalls: SessionUpdateArgs[] = [];
  const sessionTaskTimingCreateCalls: SessionTaskTimingCreateArgs[] = [];

  const sessionDetail = input.sessionDetail ?? {
    id: "session-1",
    routine: {
      tasks: [],
      sessions: [],
    },
    taskTimings: [],
  };

  const prisma = {
    session: {
      findFirst: async (args: SessionFindFirstArgs) => {
        sessionFindFirstCalls.push(args);

        if (args?.where?.status === SessionStatus.IN_PROGRESS) {
          return input.activeSession ?? null;
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
    },
    sessionTaskTiming: {
      create: async (args: SessionTaskTimingCreateArgs) => {
        sessionTaskTimingCreateCalls.push(args);
        return { id: "timing-1" };
      },
    },
  };

  return {
    service: new SessionsService(prisma as never, {} as never),
    currentUser: createCurrentUser(),
    sessionFindFirstCalls,
    sessionUpdateCalls,
    sessionTaskTimingCreateCalls,
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
  const { service, currentUser, sessionFindFirstCalls, sessionUpdateCalls, badgeEvaluationCalls, sessionDetail } =
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
  assert.deepEqual(badgeEvaluationCalls[0], {
    childId: "child-1",
    routineId: "routine-1",
    totalSeconds: 90,
    completedAt,
  });
  assert.equal(sessionFindFirstCalls.length, 2);
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
  const { service, currentUser, sessionFindFirstCalls, sessionUpdateCalls, badgeEvaluationCalls } =
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
  assert.equal(badgeEvaluationCalls.length, 0);
});

test("completeTask validates active session ownership, writes timing, increments count, and returns getById response", async () => {
  const startedAt = new Date("2026-04-08T11:59:00.000Z");
  const completedAt = new Date("2026-04-08T12:00:00.000Z");
  const activeSession = {
    id: "session-1",
    routine: {
      tasks: [
        {
          id: "task-1",
          sortOrder: 1,
          mediaLinks: [],
        },
      ],
    },
    taskTimings: [],
  };
  const {
    service,
    currentUser,
    sessionFindFirstCalls,
    sessionTaskTimingCreateCalls,
    sessionUpdateCalls,
    sessionDetail,
  } = createCompleteTaskHarness({ activeSession });

  const result = await service.completeTask(currentUser, "session-1", {
    taskId: "task-1",
    secondsSpent: 60,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
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
          tasks: {
            orderBy: { sortOrder: "asc" },
            include: {
              mediaLinks: {
                orderBy: { sortOrder: "asc" },
                include: {
                  mediaAsset: true,
                },
              },
            },
          },
        },
      },
      taskTimings: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  assert.deepEqual(sessionTaskTimingCreateCalls[0], {
    data: {
      sessionId: "session-1",
      taskId: "task-1",
      sortOrder: 1,
      secondsSpent: 60,
      startedAt,
      completedAt,
    },
  });
  assert.deepEqual(sessionUpdateCalls[0], {
    where: { id: "session-1" },
    data: {
      completedTaskCount: {
        increment: 1,
      },
    },
  });
  assert.equal(sessionFindFirstCalls.length, 2);
  assert.equal(result, sessionDetail);
});

test("completeTask preserves not-found behavior for missing or not-owned active session", async () => {
  const {
    service,
    currentUser,
    sessionFindFirstCalls,
    sessionTaskTimingCreateCalls,
    sessionUpdateCalls,
  } = createCompleteTaskHarness({ activeSession: null });

  await assert.rejects(
    () =>
      service.completeTask(currentUser, "session-1", {
        taskId: "task-1",
        secondsSpent: 60,
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
          tasks: {
            orderBy: { sortOrder: "asc" },
            include: {
              mediaLinks: {
                orderBy: { sortOrder: "asc" },
                include: {
                  mediaAsset: true,
                },
              },
            },
          },
        },
      },
      taskTimings: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  assert.equal(sessionTaskTimingCreateCalls.length, 0);
  assert.equal(sessionUpdateCalls.length, 0);
});

test("completeTask preserves task-not-in-routine validation", async () => {
  const { service, currentUser, sessionTaskTimingCreateCalls, sessionUpdateCalls } =
    createCompleteTaskHarness({
      activeSession: {
        id: "session-1",
        routine: {
          tasks: [],
        },
        taskTimings: [],
      },
    });

  await assert.rejects(
    () =>
      service.completeTask(currentUser, "session-1", {
        taskId: "task-1",
        secondsSpent: 60,
      }),
    (error) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, "A feladat nem resze a feladatsornak.");
      return true;
    },
  );

  assert.equal(sessionTaskTimingCreateCalls.length, 0);
  assert.equal(sessionUpdateCalls.length, 0);
});

test("completeTask preserves duplicate task timing validation", async () => {
  const { service, currentUser, sessionTaskTimingCreateCalls, sessionUpdateCalls } =
    createCompleteTaskHarness({
      activeSession: {
        id: "session-1",
        routine: {
          tasks: [
            {
              id: "task-1",
              sortOrder: 1,
              mediaLinks: [],
            },
          ],
        },
        taskTimings: [
          {
            taskId: "task-1",
          },
        ],
      },
    });

  await assert.rejects(
    () =>
      service.completeTask(currentUser, "session-1", {
        taskId: "task-1",
        secondsSpent: 60,
      }),
    (error) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, "Ez a feladat mar rogzitve lett ebben a sessionben.");
      return true;
    },
  );

  assert.equal(sessionTaskTimingCreateCalls.length, 0);
  assert.equal(sessionUpdateCalls.length, 0);
});

test("completeTask preserves original-order enforcement", async () => {
  const { service, currentUser, sessionTaskTimingCreateCalls, sessionUpdateCalls } =
    createCompleteTaskHarness({
      activeSession: {
        id: "session-1",
        routine: {
          tasks: [
            {
              id: "task-2",
              sortOrder: 2,
              mediaLinks: [],
            },
          ],
        },
        taskTimings: [],
      },
    });

  await assert.rejects(
    () =>
      service.completeTask(currentUser, "session-1", {
        taskId: "task-2",
        secondsSpent: 60,
      }),
    (error) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, "A feladatok jelenleg csak eredeti sorrendben teljesithetok.");
      return true;
    },
  );

  assert.equal(sessionTaskTimingCreateCalls.length, 0);
  assert.equal(sessionUpdateCalls.length, 0);
});
