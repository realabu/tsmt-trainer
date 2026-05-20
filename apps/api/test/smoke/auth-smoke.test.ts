import assert from "node:assert/strict";
import test from "node:test";
import {
  createSmokeApp,
  loginSmokeUser,
  resetSmokeUsers,
  seedSmokeParent,
} from "./smoke-helpers";

const smokeUser = {
  email: "smoke.parent@example.com",
  password: "SmokeParent123!",
  firstName: "Smoke",
  lastName: "Parent",
};

test("API smoke: login returns a token that can access /api/auth/me", async () => {
  const { app, baseUrl, prisma } = await createSmokeApp();

  try {
    await resetSmokeUsers(prisma, [smokeUser.email]);
    await seedSmokeParent(prisma, smokeUser);

    const loginResponse = await loginSmokeUser(baseUrl, smokeUser);

    assert.equal(loginResponse.status, 201);
    const loginBody = (await loginResponse.json()) as {
      accessToken?: string;
      user?: {
        email?: string;
        role?: string;
      };
    };
    assert.equal(loginBody.user?.email, smokeUser.email);
    assert.equal(loginBody.user?.role, "PARENT");
    assert.equal(typeof loginBody.accessToken, "string");

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`,
      },
    });

    assert.equal(meResponse.status, 200);
    const meBody = (await meResponse.json()) as {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    };
    assert.equal(meBody.email, smokeUser.email);
    assert.equal(meBody.firstName, smokeUser.firstName);
    assert.equal(meBody.lastName, smokeUser.lastName);
    assert.equal(meBody.role, "PARENT");
  } finally {
    await resetSmokeUsers(prisma, [smokeUser.email]);
    await app.close();
    await prisma.$disconnect();
  }
});
