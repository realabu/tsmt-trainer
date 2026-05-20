import assert from "node:assert/strict";
import test from "node:test";
import {
  createSmokeApp,
  loginSmokeUser,
  resetSmokeUsers,
  seedSmokeParent,
} from "./smoke-helpers";

const parentUser = {
  email: "smoke.parent-data@example.com",
  password: "SmokeParent123!",
  firstName: "Smoke",
  lastName: "Parent Data",
};

const otherParentUser = {
  email: "smoke.other-parent@example.com",
  password: "SmokeParent123!",
  firstName: "Other",
  lastName: "Parent",
};

test("API smoke: /api/children returns only children owned by the logged-in parent", async () => {
  const { app, baseUrl, prisma } = await createSmokeApp();
  const smokeEmails = [parentUser.email, otherParentUser.email];

  try {
    await resetSmokeUsers(prisma, smokeEmails);
    const parent = await seedSmokeParent(prisma, parentUser);
    const otherParent = await seedSmokeParent(prisma, otherParentUser);

    await prisma.child.create({
      data: {
        id: "smoke-owned-child",
        ownerId: parent.id,
        firstName: "Owned",
        lastName: "Child",
      },
    });
    await prisma.child.create({
      data: {
        id: "smoke-unrelated-child",
        ownerId: otherParent.id,
        firstName: "Unrelated",
        lastName: "Child",
      },
    });

    const loginResponse = await loginSmokeUser(baseUrl, parentUser);
    assert.equal(loginResponse.status, 201);
    const loginBody = (await loginResponse.json()) as { accessToken?: string };
    assert.equal(typeof loginBody.accessToken, "string");

    const childrenResponse = await fetch(`${baseUrl}/api/children`, {
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`,
      },
    });

    assert.equal(childrenResponse.status, 200);
    const children = (await childrenResponse.json()) as Array<{
      id: string;
      firstName?: string;
      lastName?: string;
      ownerId?: string;
      _count?: {
        routines?: number;
        sessions?: number;
      };
    }>;

    assert.equal(children.some((child) => child.id === "smoke-owned-child"), true);
    assert.equal(children.some((child) => child.id === "smoke-unrelated-child"), false);

    const ownedChild = children.find((child) => child.id === "smoke-owned-child");
    assert.equal(ownedChild?.firstName, "Owned");
    assert.equal(ownedChild?.lastName, "Child");
    assert.equal(ownedChild?.ownerId, parent.id);
    assert.deepEqual(ownedChild?._count, { routines: 0, sessions: 0 });
  } finally {
    await resetSmokeUsers(prisma, smokeEmails);
    await app.close();
    await prisma.$disconnect();
  }
});
