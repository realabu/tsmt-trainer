import assert from "node:assert/strict";
import test from "node:test";
import {
  createSmokeApp,
  loginSmokeUser,
  resetSmokeUsers,
  seedSmokeParent,
} from "./smoke-helpers";

const parentUser = {
  email: "smoke.routine-data@example.com",
  password: "SmokeParent123!",
  firstName: "Smoke",
  lastName: "Routine Data",
};

const otherParentUser = {
  email: "smoke.routine-other-parent@example.com",
  password: "SmokeParent123!",
  firstName: "Other",
  lastName: "Routine Parent",
};

test("API smoke: /api/routines returns only routines for the logged-in parent's child", async () => {
  const { app, baseUrl, prisma } = await createSmokeApp();
  const smokeEmails = [parentUser.email, otherParentUser.email];

  try {
    await resetSmokeUsers(prisma, smokeEmails);
    const parent = await seedSmokeParent(prisma, parentUser);
    const otherParent = await seedSmokeParent(prisma, otherParentUser);

    await prisma.child.create({
      data: {
        id: "smoke-routine-owned-child",
        ownerId: parent.id,
        firstName: "Routine",
        lastName: "Child",
      },
    });
    await prisma.child.create({
      data: {
        id: "smoke-routine-unrelated-child",
        ownerId: otherParent.id,
        firstName: "Unrelated",
        lastName: "Routine Child",
      },
    });

    await prisma.routine.create({
      data: {
        id: "smoke-owned-routine",
        childId: "smoke-routine-owned-child",
        name: "Owned Smoke Routine",
        description: "Visible to the smoke parent",
      },
    });
    await prisma.routine.create({
      data: {
        id: "smoke-unrelated-routine",
        childId: "smoke-routine-unrelated-child",
        name: "Unrelated Smoke Routine",
        description: "Must not leak across parents",
      },
    });

    const loginResponse = await loginSmokeUser(baseUrl, parentUser);
    assert.equal(loginResponse.status, 201);
    const loginBody = (await loginResponse.json()) as { accessToken?: string };
    assert.equal(typeof loginBody.accessToken, "string");

    const routinesResponse = await fetch(
      `${baseUrl}/api/routines?childId=smoke-routine-owned-child`,
      {
        headers: {
          Authorization: `Bearer ${loginBody.accessToken}`,
        },
      },
    );

    assert.equal(routinesResponse.status, 200);
    const routines = (await routinesResponse.json()) as Array<{
      id: string;
      childId?: string;
      name?: string;
      description?: string | null;
      tasks?: unknown[];
      periods?: unknown[];
      _count?: {
        sessions?: number;
      };
    }>;

    assert.equal(routines.some((routine) => routine.id === "smoke-owned-routine"), true);
    assert.equal(routines.some((routine) => routine.id === "smoke-unrelated-routine"), false);

    const ownedRoutine = routines.find((routine) => routine.id === "smoke-owned-routine");
    assert.equal(ownedRoutine?.childId, "smoke-routine-owned-child");
    assert.equal(ownedRoutine?.name, "Owned Smoke Routine");
    assert.equal(ownedRoutine?.description, "Visible to the smoke parent");
    assert.deepEqual(ownedRoutine?.tasks, []);
    assert.deepEqual(ownedRoutine?.periods, []);
    assert.deepEqual(ownedRoutine?._count, { sessions: 0 });
  } finally {
    await resetSmokeUsers(prisma, smokeEmails);
    await app.close();
    await prisma.$disconnect();
  }
});
