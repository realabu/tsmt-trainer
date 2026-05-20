import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import type { INestApplication } from "@nestjs/common";
import type { AddressInfo } from "node:net";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/common/prisma.service";

export interface SmokeUserFixture {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SmokeApp {
  app: INestApplication;
  baseUrl: string;
  prisma: PrismaService;
}

export async function createSmokeApp(): Promise<SmokeApp> {
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

export async function resetSmokeUsers(prisma: PrismaService, emails: string[]) {
  await prisma.user.deleteMany({
    where: { email: { in: emails } },
  });
}

export async function seedSmokeParent(prisma: PrismaService, user: SmokeUserFixture) {
  return prisma.user.create({
    data: {
      email: user.email,
      passwordHash: await hash(user.password, 12),
      firstName: user.firstName,
      lastName: user.lastName,
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

export async function loginSmokeUser(baseUrl: string, user: Pick<SmokeUserFixture, "email" | "password">) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });

  return response;
}
