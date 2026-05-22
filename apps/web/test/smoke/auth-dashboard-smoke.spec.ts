import { expect, test } from "@playwright/test";
import {
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { loadWorkspaceEnv } from "./smoke-env";

loadWorkspaceEnv();

const prisma = new PrismaClient();

const parentUser = {
  email: "smoke.browser-parent@example.com",
  password: "SmokeParent123!",
  firstName: "Browser",
  lastName: "Parent",
};

const otherParentUser = {
  email: "smoke.browser-other-parent@example.com",
  password: "SmokeParent123!",
  firstName: "Other",
  lastName: "Browser",
};

const smokeEmails = [parentUser.email, otherParentUser.email];

async function resetSmokeUsers() {
  await prisma.user.deleteMany({
    where: { email: { in: smokeEmails } },
  });
}

async function seedSmokeParent(user: typeof parentUser) {
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

test.beforeEach(async () => {
  await resetSmokeUsers();
  const parent = await seedSmokeParent(parentUser);
  const otherParent = await seedSmokeParent(otherParentUser);

  await prisma.child.create({
    data: {
      id: "smoke-browser-owned-child",
      ownerId: parent.id,
      firstName: "Browser",
      lastName: "Child",
    },
  });
  await prisma.child.create({
    data: {
      id: "smoke-browser-unrelated-child",
      ownerId: otherParent.id,
      firstName: "Unrelated",
      lastName: "Child",
    },
  });
});

test.afterEach(async () => {
  await resetSmokeUsers();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("parent can log in and see owned child on the dashboard", async ({ page }) => {
  await page.goto("/");

  const authPanel = page.locator("#auth");
  await authPanel.getByPlaceholder("Email").fill(parentUser.email);
  await authPanel.getByPlaceholder("Jelszo").fill(parentUser.password);
  await authPanel.getByRole("button", { name: "Bejelentkezes" }).last().click();

  await expect(page.getByRole("heading", { name: "Melyik gyermek tornazik most?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Browser Child/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Unrelated Child/ })).toHaveCount(0);
});
