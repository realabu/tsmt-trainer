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
const ownedChildId = "smoke-browser-owned-child";
const unrelatedChildId = "smoke-browser-unrelated-child";
const ownedRoutineId = "smoke-browser-routine";
const unrelatedRoutineId = "smoke-browser-unrelated-routine";
const ownedTaskId = "smoke-browser-task";
const ownedRoutineName = "Smoke egyensuly torna";
const unrelatedRoutineName = "Smoke masik torna";
const ownedTaskTitle = "Smoke medvejaras";

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

function dateDaysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

test.beforeEach(async () => {
  await resetSmokeUsers();
  const parent = await seedSmokeParent(parentUser);
  const otherParent = await seedSmokeParent(otherParentUser);

  const ownedChild = await prisma.child.create({
    data: {
      id: ownedChildId,
      ownerId: parent.id,
      firstName: "Browser",
      lastName: "Child",
    },
  });
  const unrelatedChild = await prisma.child.create({
    data: {
      id: unrelatedChildId,
      ownerId: otherParent.id,
      firstName: "Unrelated",
      lastName: "Child",
    },
  });

  await prisma.routine.create({
    data: {
      id: ownedRoutineId,
      childId: ownedChild.id,
      name: ownedRoutineName,
      description: "Smoke runner standby routine.",
      tasks: {
        create: {
          id: ownedTaskId,
          sortOrder: 1,
          title: ownedTaskTitle,
          details: "Keszitsd elo a macis jarast.",
          repetitionsLabel: "3 kor",
          expectedSeconds: 20,
        },
      },
      periods: {
        create: {
          name: "Smoke aktiv idoszak",
          startsOn: dateDaysFromNow(-1),
          endsOn: dateDaysFromNow(7),
          weeklyTargetCount: 2,
        },
      },
    },
  });

  await prisma.routine.create({
    data: {
      id: unrelatedRoutineId,
      childId: unrelatedChild.id,
      name: unrelatedRoutineName,
      tasks: {
        create: {
          sortOrder: 1,
          title: "Smoke nem lathato feladat",
        },
      },
      periods: {
        create: {
          name: "Smoke nem lathato idoszak",
          startsOn: dateDaysFromNow(-1),
          endsOn: dateDaysFromNow(7),
          weeklyTargetCount: 1,
        },
      },
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

test("parent can open the owned routine runner standby without starting a session", async ({ page }) => {
  await page.goto("/");

  const authPanel = page.locator("#auth");
  await authPanel.getByPlaceholder("Email").fill(parentUser.email);
  await authPanel.getByPlaceholder("Jelszo").fill(parentUser.password);
  await authPanel.getByRole("button", { name: "Bejelentkezes" }).last().click();

  await expect(page.getByRole("heading", { name: "Melyik gyermek tornazik most?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Browser Child/ })).toBeVisible();
  await expect(page.getByRole("combobox").filter({ hasText: ownedRoutineName })).toBeVisible();
  await expect(page.getByText(unrelatedRoutineName)).toHaveCount(0);

  await page.getByRole("link", { name: "Kovetkezo torna inditasa" }).click();

  await expect(page).toHaveURL(new RegExp(`/routines/${ownedRoutineId}/train$`));
  await expect(page.getByRole("heading", { name: "Indulasra kesz a torna" })).toBeVisible();
  await expect(page.getByText(ownedTaskTitle)).toBeVisible();
  await expect(page.getByRole("button", { name: "Torna inditasa" })).toBeVisible();
});
