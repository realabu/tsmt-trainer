import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { RoutinesService } from "../../src/routines/routines.service";

function createTaskCatalogSearchIncludeExpectation() {
  return {
    defaultSong: {
      include: {
        audioMedia: true,
        videoMedia: true,
      },
    },
    mediaLinks: {
      orderBy: { sortOrder: "asc" },
      include: {
        mediaAsset: true,
      },
    },
    equipmentLinks: {
      include: {
        equipmentCatalogItem: {
          include: {
            iconMedia: true,
          },
        },
      },
    },
    difficultyLevels: {
      orderBy: { sortOrder: "asc" },
    },
  };
}

function createTaskCatalogSearchExpectation(where: Record<string, unknown>) {
  return {
    where,
    orderBy: { title: "asc" },
    take: 20,
    include: createTaskCatalogSearchIncludeExpectation(),
  };
}

function createTaskCatalogSearchWhereExpectation(query: string) {
  return {
    isActive: true,
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { summary: { contains: query, mode: "insensitive" } },
      { instructions: { contains: query, mode: "insensitive" } },
      { focusPoints: { contains: query, mode: "insensitive" } },
      { demoVideoUrl: { contains: query, mode: "insensitive" } },
      {
        defaultSong: {
          is: {
            title: { contains: query, mode: "insensitive" },
          },
        },
      },
      {
        equipmentLinks: {
          some: {
            equipmentCatalogItem: {
              name: { contains: query, mode: "insensitive" },
            },
          },
        },
      },
      {
        difficultyLevels: {
          some: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  };
}

function createRoutinesTaskCatalogSearchHarness(result: Array<Record<string, unknown>> = []) {
  const calls = {
    taskCatalogItemFindMany: [] as Array<Record<string, unknown>>,
  };

  const prisma = {
    taskCatalogItem: {
      findMany: async (args: Record<string, unknown>) => {
        calls.taskCatalogItemFindMany.push(args);
        return result;
      },
    },
  };

  const service = new RoutinesService(prisma as never);
  const currentUser = {
    sub: "parent-1",
    email: "parent@example.com",
    role: UserRole.PARENT,
  };

  return { calls, currentUser, service };
}

test("searchTaskCatalog throws NotFoundException when current user is missing", async () => {
  const { service } = createRoutinesTaskCatalogSearchHarness();

  await assert.rejects(
    () =>
      service.searchTaskCatalog({
        sub: "",
        email: "parent@example.com",
        role: UserRole.PARENT,
      }),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Felhasznalo nem talalhato.");
      return true;
    },
  );
});

test("searchTaskCatalog uses active catalog query shape when query is undefined", async () => {
  const result = [{ id: "catalog-1", title: "Labda" }];
  const { calls, currentUser, service } = createRoutinesTaskCatalogSearchHarness(result);

  const response = await service.searchTaskCatalog(currentUser);

  assert.equal(response, result);
  assert.deepEqual(calls.taskCatalogItemFindMany, [
    createTaskCatalogSearchExpectation({ isActive: true }),
  ]);
});

test("searchTaskCatalog trims whitespace-only query and does not add OR search", async () => {
  const { calls, currentUser, service } = createRoutinesTaskCatalogSearchHarness();

  await service.searchTaskCatalog(currentUser, "   ");

  assert.deepEqual(calls.taskCatalogItemFindMany, [
    createTaskCatalogSearchExpectation({ isActive: true }),
  ]);
});

test("searchTaskCatalog trims non-empty query and searches all current catalog fields", async () => {
  const result = [{ id: "catalog-2", title: "Egyensuly" }];
  const { calls, currentUser, service } = createRoutinesTaskCatalogSearchHarness(result);

  const response = await service.searchTaskCatalog(currentUser, "  labda  ");

  assert.equal(response, result);
  assert.deepEqual(calls.taskCatalogItemFindMany, [
    createTaskCatalogSearchExpectation(createTaskCatalogSearchWhereExpectation("labda")),
  ]);
});
