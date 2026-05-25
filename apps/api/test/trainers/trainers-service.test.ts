import assert from "node:assert/strict";
import test from "node:test";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { TrainerAssignmentStatus, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../../src/auth/auth.types";
import { TrainersService } from "../../src/trainers/trainers.service";

type TrainersHarnessConfig = {
  routine?: Record<string, unknown> | null;
  trainer?: Record<string, unknown> | null;
  existingAssignment?: Record<string, unknown> | null;
  createResult?: Record<string, unknown>;
  listResult?: Array<Record<string, unknown>>;
  overviewAssignment?: Record<string, unknown> | null;
  revokeLookup?: Record<string, unknown> | null;
};

function user(role: UserRole, overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    sub: `${role.toLowerCase()}-1`,
    email: `${role.toLowerCase()}@example.com`,
    role,
    ...overrides,
  };
}

function createInput(overrides: Partial<{
  childId: string;
  routineId: string;
  trainerEmail: string;
  status: "PENDING" | "ACTIVE";
}> = {}) {
  return {
    childId: "child-1",
    routineId: "routine-1",
    trainerEmail: "Trainer@Example.COM",
    status: "ACTIVE" as const,
    ...overrides,
  };
}

function createHarness(config: TrainersHarnessConfig = {}) {
  const calls = {
    routineFindFirst: [] as Array<Record<string, unknown>>,
    userFindUnique: [] as Array<Record<string, unknown>>,
    assignmentFindFirst: [] as Array<Record<string, unknown>>,
    assignmentFindMany: [] as Array<Record<string, unknown>>,
    assignmentCreate: [] as Array<Record<string, unknown>>,
    assignmentUpdate: [] as Array<Record<string, unknown>>,
  };

  const prisma = {
    routine: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.routineFindFirst.push(args);
        return "routine" in config ? config.routine : { id: "routine-1", childId: "child-1" };
      },
    },
    user: {
      findUnique: async (args: Record<string, unknown>) => {
        calls.userFindUnique.push(args);
        return "trainer" in config
          ? config.trainer
          : {
              id: "trainer-1",
              email: "trainer@example.com",
              firstName: "Trainer",
              lastName: "User",
              role: UserRole.TRAINER,
            };
      },
    },
    routineAssignment: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.assignmentFindFirst.push(args);
        if ("overviewAssignment" in config) {
          return config.overviewAssignment;
        }
        if ("revokeLookup" in config) {
          return config.revokeLookup;
        }
        return "existingAssignment" in config ? config.existingAssignment : null;
      },
      findMany: async (args: Record<string, unknown>) => {
        calls.assignmentFindMany.push(args);
        return config.listResult ?? [];
      },
      create: async (args: Record<string, unknown>) => {
        calls.assignmentCreate.push(args);
        return config.createResult ?? { id: "assignment-1" };
      },
      update: async (args: Record<string, unknown>) => {
        calls.assignmentUpdate.push(args);
        return { id: "assignment-1" };
      },
    },
  };

  return {
    calls,
    service: new TrainersService(prisma as never),
  };
}

test("createAssignment rejects non-parent and non-admin current users", async () => {
  const { service } = createHarness();

  await assert.rejects(
    () => service.createAssignment(user(UserRole.TRAINER), createInput()),
    ForbiddenException,
  );
});

test("createAssignment uses parent-owned routine lookup and lowercases trainer email", async () => {
  const { calls, service } = createHarness();

  await service.createAssignment(user(UserRole.PARENT, { sub: "parent-1" }), createInput());

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
        childId: "child-1",
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
  assert.deepEqual(calls.userFindUnique, [
    {
      where: {
        email: "trainer@example.com",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    },
  ]);
});

test("createAssignment rejects target users who are not trainer or admin", async () => {
  const { service } = createHarness({
    trainer: {
      id: "not-trainer-1",
      email: "parent@example.com",
      firstName: "Parent",
      lastName: "User",
      role: UserRole.PARENT,
    },
  });

  await assert.rejects(
    () => service.createAssignment(user(UserRole.PARENT), createInput()),
    BadRequestException,
  );
});

test("createAssignment returns existing active assignment without creating duplicate", async () => {
  const existing = { id: "existing-assignment" };
  const { calls, service } = createHarness({
    existingAssignment: existing,
  });

  const result = await service.createAssignment(user(UserRole.PARENT), createInput());

  assert.equal(result, existing);
  assert.deepEqual(calls.assignmentFindFirst, [
    {
      where: {
        childId: "child-1",
        routineId: "routine-1",
        trainerId: "trainer-1",
        revokedAt: null,
      },
    },
  ]);
  assert.deepEqual(calls.assignmentCreate, []);
});

test("createAssignment maps ACTIVE and PENDING statuses into current create shape", async () => {
  const { calls, service } = createHarness();

  await service.createAssignment(user(UserRole.PARENT), createInput({ status: "ACTIVE" }));
  await service.createAssignment(user(UserRole.PARENT), createInput({ status: "PENDING" }));

  assert.deepEqual(
    calls.assignmentCreate.map((call) => call.data),
    [
      {
        childId: "child-1",
        routineId: "routine-1",
        trainerId: "trainer-1",
        status: TrainerAssignmentStatus.ACTIVE,
      },
      {
        childId: "child-1",
        routineId: "routine-1",
        trainerId: "trainer-1",
        status: TrainerAssignmentStatus.PENDING,
      },
    ],
  );
  assert.deepEqual(calls.assignmentCreate[0]?.include, createAssignmentIncludeExpectation());
});

test("listOwnedAssignments rejects trainer role and preserves parent-owned filters/include shape", async () => {
  const { calls, service } = createHarness();

  await assert.rejects(
    () => service.listOwnedAssignments(user(UserRole.TRAINER), "child-1", "routine-1"),
    ForbiddenException,
  );

  await service.listOwnedAssignments(user(UserRole.PARENT, { sub: "parent-1" }), "child-1", "routine-1");

  assert.deepEqual(calls.assignmentFindMany, [
    {
      where: {
        childId: "child-1",
        routineId: "routine-1",
        revokedAt: null,
        child: {
          ownerId: "parent-1",
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
      include: {
        trainer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        routine: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  ]);
});

test("admin listOwnedAssignments is role-allowed but still uses currentUser.sub ownership filter", async () => {
  const { calls, service } = createHarness();

  await service.listOwnedAssignments(user(UserRole.ADMIN, { sub: "admin-1" }));

  assert.deepEqual(calls.assignmentFindMany[0]?.where, {
    revokedAt: null,
    child: {
      ownerId: "admin-1",
    },
  });
});

test("listMyAssignments rejects parent role and preserves trainer dashboard query shape", async () => {
  const { calls, service } = createHarness();

  await assert.rejects(
    () => service.listMyAssignments(user(UserRole.PARENT)),
    ForbiddenException,
  );

  await service.listMyAssignments(user(UserRole.TRAINER, { sub: "trainer-1" }));

  const query = calls.assignmentFindMany[0] as {
    where?: unknown;
    orderBy?: unknown;
    include?: {
      routine?: {
        include?: Record<string, unknown>;
      };
    };
  };

  assert.deepEqual(query.where, {
    trainerId: "trainer-1",
    revokedAt: null,
  });
  assert.deepEqual(query.orderBy, {
    assignedAt: "desc",
  });
  const routineInclude = query.include?.routine?.include as Record<string, unknown>;
  assert.deepEqual(routineInclude.periods, { orderBy: { startsOn: "asc" } });
  assert.deepEqual(routineInclude.sessions, {
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  assert.deepEqual(routineInclude.tasks, {
    orderBy: { sortOrder: "asc" },
    include: {
      mediaLinks: {
        orderBy: { sortOrder: "asc" },
        include: {
          mediaAsset: true,
        },
      },
    },
  });
  assert.deepEqual(routineInclude.trainerAssignments, activeTrainerAssignmentsIncludeExpectation());
});

test("admin listMyAssignments is role-allowed but still uses currentUser.sub trainer filter", async () => {
  const { calls, service } = createHarness();

  await service.listMyAssignments(user(UserRole.ADMIN, { sub: "admin-1" }));

  assert.deepEqual(calls.assignmentFindMany[0]?.where, {
    trainerId: "admin-1",
    revokedAt: null,
  });
});

test("getTrainerRoutineOverview rejects parent role and preserves detail query shape", async () => {
  const { calls, service } = createHarness({
    overviewAssignment: { id: "assignment-1" },
  });

  await assert.rejects(
    () => service.getTrainerRoutineOverview(user(UserRole.PARENT), "assignment-1"),
    ForbiddenException,
  );

  await service.getTrainerRoutineOverview(user(UserRole.TRAINER, { sub: "trainer-1" }), "assignment-1");

  const query = calls.assignmentFindFirst[0] as {
    where?: unknown;
    include?: {
      child?: {
        include?: Record<string, unknown>;
      };
      routine?: {
        include?: Record<string, unknown>;
      };
    };
  };

  assert.deepEqual(query.where, {
    id: "assignment-1",
    trainerId: "trainer-1",
    revokedAt: null,
  });
  assert.deepEqual(query.include?.child?.include?.badgeAwards, {
    orderBy: { awardedAt: "desc" },
    take: 12,
    include: {
      badgeDefinition: true,
    },
  });

  const routineInclude = query.include?.routine?.include as Record<string, unknown>;
  assert.deepEqual(routineInclude.periods, { orderBy: { startsOn: "asc" } });
  assert.deepEqual(routineInclude.tasks, {
    orderBy: { sortOrder: "asc" },
    include: {
      mediaLinks: {
        orderBy: { sortOrder: "asc" },
        include: {
          mediaAsset: true,
        },
      },
    },
  });
  assert.deepEqual(routineInclude.sessions, {
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      taskTimings: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  assert.deepEqual(routineInclude.trainerAssignments, activeTrainerAssignmentsIncludeExpectation());
});

test("getTrainerRoutineOverview returns not found when assignment is not visible to trainer", async () => {
  const { service } = createHarness({
    overviewAssignment: null,
  });

  await assert.rejects(
    () => service.getTrainerRoutineOverview(user(UserRole.TRAINER), "assignment-1"),
    NotFoundException,
  );
});

test("admin getTrainerRoutineOverview is role-allowed but still uses currentUser.sub trainer filter", async () => {
  const { calls, service } = createHarness({
    overviewAssignment: { id: "assignment-1" },
  });

  await service.getTrainerRoutineOverview(user(UserRole.ADMIN, { sub: "admin-1" }), "assignment-1");

  assert.deepEqual(calls.assignmentFindFirst[0]?.where, {
    id: "assignment-1",
    trainerId: "admin-1",
    revokedAt: null,
  });
});

test("revokeAssignment rejects trainer role and soft-revokes parent-owned active assignment", async () => {
  const { calls, service } = createHarness({
    revokeLookup: { id: "assignment-1" },
  });

  await assert.rejects(
    () => service.revokeAssignment(user(UserRole.TRAINER), "assignment-1"),
    ForbiddenException,
  );

  const result = await service.revokeAssignment(user(UserRole.PARENT, { sub: "parent-1" }), "assignment-1");

  assert.deepEqual(calls.assignmentFindFirst, [
    {
      where: {
        id: "assignment-1",
        revokedAt: null,
        child: {
          ownerId: "parent-1",
        },
      },
      select: {
        id: true,
      },
    },
  ]);
  assert.equal(calls.assignmentUpdate.length, 1);
  assert.deepEqual(calls.assignmentUpdate[0]?.where, { id: "assignment-1" });
  const data = calls.assignmentUpdate[0]?.data as {
    revokedAt?: unknown;
    status?: unknown;
  };
  assert.equal(data.revokedAt instanceof Date, true);
  assert.equal(data.status, TrainerAssignmentStatus.REVOKED);
  assert.deepEqual(result, { success: true });
});

test("revokeAssignment returns not found when active parent-owned assignment is absent", async () => {
  const { service } = createHarness({
    revokeLookup: null,
  });

  await assert.rejects(
    () => service.revokeAssignment(user(UserRole.PARENT), "assignment-1"),
    NotFoundException,
  );
});

function createAssignmentIncludeExpectation() {
  return {
    trainer: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    },
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
      },
    },
  };
}

function activeTrainerAssignmentsIncludeExpectation() {
  return {
    where: {
      revokedAt: null,
    },
    include: {
      trainer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
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
    },
  };
}
