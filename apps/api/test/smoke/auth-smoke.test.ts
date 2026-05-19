import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/common/prisma.service";

const smokeUser = {
  email: "smoke.parent@example.com",
  password: "SmokeParent123!",
  firstName: "Smoke",
  lastName: "Parent",
};

async function createSmokeApp() {
  process.env.JWT_ACCESS_SECRET ??= "smoke-access-secret";
  process.env.JWT_REFRESH_SECRET ??= "smoke-refresh-secret";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for API smoke tests.");
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(0, "127.0.0.1");

  const serverAddress = app.getHttpServer().address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${serverAddress.port}`;
  const prisma = app.get(PrismaService);

  return { app, baseUrl, prisma };
}

async function resetSmokeUser(prisma: PrismaService) {
  await prisma.user.deleteMany({
    where: { email: smokeUser.email },
  });
}

async function seedSmokeUser(prisma: PrismaService) {
  await prisma.user.create({
    data: {
      email: smokeUser.email,
      passwordHash: await hash(smokeUser.password, 12),
      firstName: smokeUser.firstName,
      lastName: smokeUser.lastName,
      role: UserRole.PARENT,
      subscriptions: {
        create: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.FREE,
        },
      },
    },
  });
}

test("API smoke: login returns a token that can access /api/auth/me", async () => {
  const { app, baseUrl, prisma } = await createSmokeApp();

  try {
    await resetSmokeUser(prisma);
    await seedSmokeUser(prisma);

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: smokeUser.email,
        password: smokeUser.password,
      }),
    });

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
    await resetSmokeUser(prisma);
    await app.close();
    await prisma.$disconnect();
  }
});
