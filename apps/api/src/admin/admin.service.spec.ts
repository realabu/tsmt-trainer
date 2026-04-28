import assert from "node:assert/strict";
import test from "node:test";
import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AdminService } from "./admin.service";

function createDomainServiceMocks() {
  return {
    adminUserService: {
      listUsers: async (_currentUser: unknown) => ["user-result"],
    },
    adminActivityService: {
      listRoutines: async (_currentUser: unknown, _parentId?: string, _childId?: string) => [
        "routine-result",
      ],
    },
    adminCatalogService: {
      listTaskCatalog: async (_currentUser: unknown) => ["task-catalog-result"],
    },
  };
}

function createAdminService() {
  const mocks = createDomainServiceMocks();
  const service = new AdminService(
    mocks.adminActivityService as never,
    mocks.adminCatalogService as never,
    mocks.adminUserService as never,
  );

  return { service, mocks };
}

const nonAdminUser = {
  role: UserRole.PARENT,
} as never;

const adminUser = {
  role: UserRole.ADMIN,
} as never;

test("listUsers throws ForbiddenException for non-admin user", async () => {
  const { service } = createAdminService();

  await assert.rejects(
    () => service.listUsers(nonAdminUser),
    (error: unknown) =>
      error instanceof ForbiddenException &&
      error.message === "Ez a muvelet admin szerepkort igenyel.",
  );
});

test("listRoutines throws ForbiddenException for non-admin user", async () => {
  const { service } = createAdminService();

  await assert.rejects(
    () => service.listRoutines(nonAdminUser),
    (error: unknown) =>
      error instanceof ForbiddenException &&
      error.message === "Ez a muvelet admin szerepkort igenyel.",
  );
});

test("listTaskCatalog throws ForbiddenException for non-admin user", async () => {
  const { service } = createAdminService();

  await assert.rejects(
    () => service.listTaskCatalog(nonAdminUser),
    (error: unknown) =>
      error instanceof ForbiddenException &&
      error.message === "Ez a muvelet admin szerepkort igenyel.",
  );
});

test("listUsers delegates to AdminUserService for admin user", async () => {
  let receivedCurrentUser: unknown;
  const { service, mocks } = createAdminService();
  mocks.adminUserService.listUsers = async (currentUser: unknown) => {
    receivedCurrentUser = currentUser;
    return ["delegated-user"];
  };

  const result = await service.listUsers(adminUser);

  assert.deepEqual(result, ["delegated-user"]);
  assert.equal(receivedCurrentUser, adminUser);
});

test("listRoutines delegates to AdminActivityService for admin user", async () => {
  let receivedArgs: unknown[] = [];
  const { service, mocks } = createAdminService();
  mocks.adminActivityService.listRoutines = async (...args: unknown[]) => {
    receivedArgs = args;
    return ["delegated-routine"];
  };

  const result = await service.listRoutines(adminUser, "parent-1", "child-1");

  assert.deepEqual(result, ["delegated-routine"]);
  assert.deepEqual(receivedArgs, [adminUser, "parent-1", "child-1"]);
});

test("listTaskCatalog delegates to AdminCatalogService for admin user", async () => {
  let receivedCurrentUser: unknown;
  const { service, mocks } = createAdminService();
  mocks.adminCatalogService.listTaskCatalog = async (currentUser: unknown) => {
    receivedCurrentUser = currentUser;
    return ["delegated-task-catalog"];
  };

  const result = await service.listTaskCatalog(adminUser);

  assert.deepEqual(result, ["delegated-task-catalog"]);
  assert.equal(receivedCurrentUser, adminUser);
});
