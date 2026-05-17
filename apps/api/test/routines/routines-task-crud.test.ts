import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { MediaKind, UserRole } from "@prisma/client";
import { RoutinesService } from "../../src/routines/routines.service";

type RoutineTaskHarnessConfig = {
  ownedRoutine?: { id: string; childId: string } | null;
  ownedTask?: { id: string; routineId: string; customImageMediaId: string | null } | null;
  aggregateMaxSortOrder?: number | null;
  catalogTask?: Record<string, unknown> | null;
  difficultyLevel?: Record<string, unknown> | null;
  song?: { id: string } | null;
  createResult?: Record<string, unknown>;
  updateResult?: Record<string, unknown>;
  deleteResult?: Record<string, unknown>;
};

function createRoutineTaskIncludeExpectation() {
  return {
    catalogTask: {
      include: {
        defaultSong: true,
        difficultyLevels: {
          orderBy: { sortOrder: "asc" },
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
      },
    },
    catalogDifficultyLevel: true,
    song: {
      include: {
        audioMedia: true,
        videoMedia: true,
      },
    },
    customImageMedia: true,
    mediaLinks: {
      orderBy: { sortOrder: "asc" },
      include: {
        mediaAsset: true,
      },
    },
  };
}

function createRoutinesTaskHarness(config: RoutineTaskHarnessConfig = {}) {
  const calls = {
    routineFindFirst: [] as Array<Record<string, unknown>>,
    routineTaskFindFirst: [] as Array<Record<string, unknown>>,
    routineTaskAggregate: [] as Array<Record<string, unknown>>,
    taskCatalogItemFindFirst: [] as Array<Record<string, unknown>>,
    taskCatalogDifficultyLevelFindUnique: [] as Array<Record<string, unknown>>,
    songCatalogItemFindFirst: [] as Array<Record<string, unknown>>,
    routineTaskCreate: [] as Array<Record<string, unknown>>,
    routineTaskUpdate: [] as Array<Record<string, unknown>>,
    routineTaskDelete: [] as Array<Record<string, unknown>>,
    taskMediaLinkDeleteMany: [] as Array<Record<string, unknown>>,
  };

  const prisma = {
    routine: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.routineFindFirst.push(args);
        return "ownedRoutine" in config
          ? config.ownedRoutine
          : {
              id: "routine-1",
              childId: "child-1",
            };
      },
    },
    taskCatalogItem: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.taskCatalogItemFindFirst.push(args);
        return "catalogTask" in config
          ? config.catalogTask
          : null;
      },
    },
    taskCatalogDifficultyLevel: {
      findUnique: async (args: Record<string, unknown>) => {
        calls.taskCatalogDifficultyLevelFindUnique.push(args);
        return "difficultyLevel" in config
          ? config.difficultyLevel
          : null;
      },
    },
    songCatalogItem: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.songCatalogItemFindFirst.push(args);
        return "song" in config
          ? config.song
          : null;
      },
    },
    routineTask: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.routineTaskFindFirst.push(args);
        return "ownedTask" in config
          ? config.ownedTask
          : {
              id: "task-1",
              routineId: "routine-1",
              customImageMediaId: null,
            };
      },
      aggregate: async (args: Record<string, unknown>) => {
        calls.routineTaskAggregate.push(args);
        return {
          _max: {
            sortOrder: "aggregateMaxSortOrder" in config ? config.aggregateMaxSortOrder : 4,
          },
        };
      },
      create: async (args: Record<string, unknown>) => {
        calls.routineTaskCreate.push(args);
        return (
          config.createResult ?? {
            id: "task-1",
            title: "Labda feldobas",
            details: undefined,
            coachText: null,
            repetitionsLabel: null,
            repetitionCount: null,
            repetitionUnitCount: null,
          }
        );
      },
      update: async (args: Record<string, unknown>) => {
        calls.routineTaskUpdate.push(args);
        return (
          config.updateResult ?? {
            id: "task-1",
            title: "Frissitett feladat",
            details: undefined,
            coachText: null,
            repetitionsLabel: null,
            repetitionCount: null,
            repetitionUnitCount: null,
          }
        );
      },
      delete: async (args: Record<string, unknown>) => {
        calls.routineTaskDelete.push(args);
        return config.deleteResult ?? { id: "task-1" };
      },
    },
    taskMediaLink: {
      deleteMany: async (args: Record<string, unknown>) => {
        calls.taskMediaLinkDeleteMany.push(args);
        return { count: 0 };
      },
    },
  };

  const service = new RoutinesService(prisma as never, {} as never);
  const currentUser = {
    sub: "parent-1",
    email: "parent@example.com",
    role: UserRole.PARENT,
  };

  return { calls, service, currentUser };
}

test("createTask uses owned routine lookup, max sort order query, and current Prisma create shape", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    aggregateMaxSortOrder: 4,
    createResult: {
      id: "task-1",
      title: "Labda feldobas",
      details: null,
      coachText: null,
      repetitionsLabel: null,
      repetitionCount: null,
      repetitionUnitCount: null,
    },
  });

  const result = await service.createTask(currentUser, "routine-1", {
    sortOrder: 1,
    title: "Labda feldobas",
  });

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
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

  assert.deepEqual(calls.routineTaskAggregate, [
    {
      where: { routineId: "routine-1" },
      _max: { sortOrder: true },
    },
  ]);

  assert.deepEqual(calls.routineTaskCreate, [
    {
      data: {
        routine: {
          connect: {
            id: "routine-1",
          },
        },
        sortOrder: 1,
        title: "Labda feldobas",
        details: null,
        coachText: null,
        repetitionsLabel: null,
        repetitionCount: null,
        repetitionUnitCount: null,
        catalogTask: undefined,
        catalogDifficultyLevel: undefined,
        song: undefined,
        customImageMedia: undefined,
        mediaLinks: {
          create: [],
        },
      },
      include: createRoutineTaskIncludeExpectation(),
    },
  ]);

  assert.deepEqual(result, {
    id: "task-1",
    title: "Labda feldobas",
    details: null,
    coachText: null,
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: null,
  });
});

test("createTask preserves current catalog-connected create path with difficulty and default song fallback", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    aggregateMaxSortOrder: 4,
    catalogTask: {
      id: "catalog-1",
      title: "Katalogus feladat",
      summary: "Mintaleiras",
      defaultSongId: "song-1",
      defaultSong: { id: "song-1", title: "Mondoka" },
      difficultyLevels: [
        {
          id: "difficulty-1",
          taskCatalogItemId: "catalog-1",
        },
      ],
    },
    difficultyLevel: {
      id: "difficulty-1",
      taskCatalogItemId: "catalog-1",
    },
    song: { id: "song-1" },
    createResult: {
      id: "task-2",
      title: "Katalogus feladat",
      details: "Mintaleiras",
      coachText: null,
      repetitionsLabel: null,
      repetitionCount: null,
      repetitionUnitCount: null,
    },
  });

  const result = await service.createTask(
    currentUser,
    "routine-1",
    {
      sortOrder: 3,
      catalogTaskId: "catalog-1",
      catalogDifficultyLevelId: "difficulty-1",
    } as any,
  );

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
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

  assert.deepEqual(calls.taskCatalogItemFindFirst, [
    {
      where: {
        id: "catalog-1",
        isActive: true,
      },
      include: {
        defaultSong: true,
        difficultyLevels: {
          orderBy: { sortOrder: "asc" },
        },
      },
    },
  ]);

  assert.deepEqual(calls.taskCatalogDifficultyLevelFindUnique, [
    {
      where: { id: "difficulty-1" },
    },
  ]);

  assert.deepEqual(calls.songCatalogItemFindFirst, [
    {
      where: {
        id: "song-1",
        isActive: true,
      },
      select: { id: true },
    },
  ]);

  assert.deepEqual(calls.routineTaskAggregate, [
    {
      where: { routineId: "routine-1" },
      _max: { sortOrder: true },
    },
  ]);

  assert.deepEqual(calls.routineTaskCreate, [
    {
      data: {
        routine: {
          connect: {
            id: "routine-1",
          },
        },
        sortOrder: 3,
        title: "Katalogus feladat",
        details: "Mintaleiras",
        coachText: null,
        repetitionsLabel: null,
        repetitionCount: null,
        repetitionUnitCount: null,
        catalogTask: {
          connect: {
            id: "catalog-1",
          },
        },
        catalogDifficultyLevel: {
          connect: {
            id: "difficulty-1",
          },
        },
        song: {
          connect: {
            id: "song-1",
          },
        },
        customImageMedia: undefined,
        mediaLinks: {
          create: [],
        },
      },
      include: createRoutineTaskIncludeExpectation(),
    },
  ]);

  assert.deepEqual(result, {
    id: "task-2",
    title: "Katalogus feladat",
    details: "Mintaleiras",
    coachText: null,
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: null,
  });
});

test("createTask throws when catalog task is missing", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    catalogTask: null,
  });

  await assert.rejects(
    service.createTask(
      currentUser,
      "routine-1",
      {
        sortOrder: 3,
        catalogTaskId: "catalog-missing",
        catalogDifficultyLevelId: "difficulty-1",
      } as any,
    ),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Az egyik kivalasztott katalogus feladat nem talalhato.");
      return true;
    },
  );

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
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

  assert.deepEqual(calls.taskCatalogItemFindFirst, [
    {
      where: {
        id: "catalog-missing",
        isActive: true,
      },
      include: {
        defaultSong: true,
        difficultyLevels: {
          orderBy: { sortOrder: "asc" },
        },
      },
    },
  ]);
  assert.deepEqual(calls.taskCatalogDifficultyLevelFindUnique, []);
  assert.deepEqual(calls.songCatalogItemFindFirst, []);
  assert.deepEqual(calls.routineTaskAggregate, []);
  assert.deepEqual(calls.routineTaskCreate, []);
});

test("createTask throws when catalog difficulty level is missing", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    catalogTask: {
      id: "catalog-1",
      title: "Katalogus feladat",
      summary: "Mintaleiras",
      defaultSongId: "song-1",
      defaultSong: { id: "song-1", title: "Mondoka" },
      difficultyLevels: [
        {
          id: "difficulty-1",
          taskCatalogItemId: "catalog-1",
        },
      ],
    },
    difficultyLevel: null,
  });

  await assert.rejects(
    service.createTask(
      currentUser,
      "routine-1",
      {
        sortOrder: 3,
        catalogTaskId: "catalog-1",
        catalogDifficultyLevelId: "difficulty-missing",
      } as any,
    ),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "A kivalasztott nehezsegi szint nem talalhato.");
      return true;
    },
  );

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
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

  assert.deepEqual(calls.taskCatalogItemFindFirst, [
    {
      where: {
        id: "catalog-1",
        isActive: true,
      },
      include: {
        defaultSong: true,
        difficultyLevels: {
          orderBy: { sortOrder: "asc" },
        },
      },
    },
  ]);

  assert.deepEqual(calls.taskCatalogDifficultyLevelFindUnique, [
    {
      where: { id: "difficulty-missing" },
    },
  ]);
  assert.deepEqual(calls.songCatalogItemFindFirst, []);
  assert.deepEqual(calls.routineTaskAggregate, []);
  assert.deepEqual(calls.routineTaskCreate, []);
});

test("createTask throws when title is missing after fallback", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness();

  await assert.rejects(
    service.createTask(
      currentUser,
      "routine-1",
      {
        sortOrder: 3,
      } as any,
    ),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, "Minden rutin feladathoz kell cim vagy katalogus forras.");
      return true;
    },
  );

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
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
  assert.deepEqual(calls.routineTaskAggregate, []);
  assert.deepEqual(calls.routineTaskCreate, []);
});

test("createTask preserves explicit songId override over catalog default song fallback", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    aggregateMaxSortOrder: 4,
    catalogTask: {
      id: "catalog-1",
      title: "Katalogus feladat",
      summary: "Mintaleiras",
      defaultSongId: "song-default",
      defaultSong: { id: "song-default", title: "Alap mondoka" },
      difficultyLevels: [
        {
          id: "difficulty-1",
          taskCatalogItemId: "catalog-1",
        },
      ],
    },
    difficultyLevel: {
      id: "difficulty-1",
      taskCatalogItemId: "catalog-1",
    },
    song: { id: "song-explicit" },
    createResult: {
      id: "task-2",
      title: "Katalogus feladat",
      details: "Mintaleiras",
      coachText: null,
      repetitionsLabel: null,
      repetitionCount: null,
      repetitionUnitCount: null,
    },
  });

  const result = await service.createTask(
    currentUser,
    "routine-1",
    {
      sortOrder: 3,
      catalogTaskId: "catalog-1",
      catalogDifficultyLevelId: "difficulty-1",
      songId: "song-explicit",
    } as any,
  );

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
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

  assert.deepEqual(calls.taskCatalogItemFindFirst, [
    {
      where: {
        id: "catalog-1",
        isActive: true,
      },
      include: {
        defaultSong: true,
        difficultyLevels: {
          orderBy: { sortOrder: "asc" },
        },
      },
    },
  ]);

  assert.deepEqual(calls.taskCatalogDifficultyLevelFindUnique, [
    {
      where: { id: "difficulty-1" },
    },
  ]);

  assert.deepEqual(calls.songCatalogItemFindFirst, [
    {
      where: {
        id: "song-explicit",
        isActive: true,
      },
      select: { id: true },
    },
  ]);

  assert.deepEqual(calls.routineTaskAggregate, [
    {
      where: { routineId: "routine-1" },
      _max: { sortOrder: true },
    },
  ]);

  assert.deepEqual(calls.routineTaskCreate, [
    {
      data: {
        routine: {
          connect: {
            id: "routine-1",
          },
        },
        sortOrder: 3,
        title: "Katalogus feladat",
        details: "Mintaleiras",
        coachText: null,
        repetitionsLabel: null,
        repetitionCount: null,
        repetitionUnitCount: null,
        catalogTask: {
          connect: {
            id: "catalog-1",
          },
        },
        catalogDifficultyLevel: {
          connect: {
            id: "difficulty-1",
          },
        },
        song: {
          connect: {
            id: "song-explicit",
          },
        },
        customImageMedia: undefined,
        mediaLinks: {
          create: [],
        },
      },
      include: createRoutineTaskIncludeExpectation(),
    },
  ]);

  assert.deepEqual(result, {
    id: "task-2",
    title: "Katalogus feladat",
    details: "Mintaleiras",
    coachText: null,
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: null,
  });
});

test("createTask throws when explicit songId override is missing", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    catalogTask: {
      id: "catalog-1",
      title: "Katalogus feladat",
      summary: "Mintaleiras",
      defaultSongId: "song-default",
      defaultSong: { id: "song-default", title: "Alap mondoka" },
      difficultyLevels: [
        {
          id: "difficulty-1",
          taskCatalogItemId: "catalog-1",
        },
      ],
    },
    difficultyLevel: {
      id: "difficulty-1",
      taskCatalogItemId: "catalog-1",
    },
    song: null,
  });

  await assert.rejects(
    service.createTask(
      currentUser,
      "routine-1",
      {
        sortOrder: 3,
        catalogTaskId: "catalog-1",
        catalogDifficultyLevelId: "difficulty-1",
        songId: "song-missing",
      } as any,
    ),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "A rutin feladathoz megadott dal vagy mondoka nem talalhato.");
      return true;
    },
  );

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
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

  assert.deepEqual(calls.taskCatalogItemFindFirst, [
    {
      where: {
        id: "catalog-1",
        isActive: true,
      },
      include: {
        defaultSong: true,
        difficultyLevels: {
          orderBy: { sortOrder: "asc" },
        },
      },
    },
  ]);

  assert.deepEqual(calls.taskCatalogDifficultyLevelFindUnique, [
    {
      where: { id: "difficulty-1" },
    },
  ]);

  assert.deepEqual(calls.songCatalogItemFindFirst, [
    {
      where: {
        id: "song-missing",
        isActive: true,
      },
      select: { id: true },
    },
  ]);
  assert.deepEqual(calls.routineTaskAggregate, []);
  assert.deepEqual(calls.routineTaskCreate, []);
});

test("createTask throws when selected difficulty belongs to another catalog task", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    catalogTask: {
      id: "catalog-1",
      title: "Katalogus feladat",
      summary: "Mintaleiras",
      defaultSongId: "song-1",
      defaultSong: { id: "song-1", title: "Mondoka" },
      difficultyLevels: [
        {
          id: "difficulty-other",
          taskCatalogItemId: "catalog-other",
        },
      ],
    },
    difficultyLevel: {
      id: "difficulty-other",
      taskCatalogItemId: "catalog-other",
    },
  });

  await assert.rejects(
    service.createTask(
      currentUser,
      "routine-1",
      {
        sortOrder: 3,
        catalogTaskId: "catalog-1",
        catalogDifficultyLevelId: "difficulty-other",
      } as any,
    ),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(
        error.message,
        "A kivalasztott nehezsegi szint nem ehhez a katalogus taskhoz tartozik.",
      );
      return true;
    },
  );

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
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

  assert.deepEqual(calls.taskCatalogItemFindFirst, [
    {
      where: {
        id: "catalog-1",
        isActive: true,
      },
      include: {
        defaultSong: true,
        difficultyLevels: {
          orderBy: { sortOrder: "asc" },
        },
      },
    },
  ]);

  assert.deepEqual(calls.taskCatalogDifficultyLevelFindUnique, [
    {
      where: { id: "difficulty-other" },
    },
  ]);
  assert.deepEqual(calls.songCatalogItemFindFirst, []);
  assert.deepEqual(calls.routineTaskAggregate, []);
  assert.deepEqual(calls.routineTaskCreate, []);
});

test("createTask preserves current custom image and media link create shape", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    aggregateMaxSortOrder: 4,
    createResult: {
      id: "task-3",
      title: "Keptamaszos feladat",
      details: null,
      coachText: null,
      repetitionsLabel: null,
      repetitionCount: null,
      repetitionUnitCount: null,
    },
  });

  const result = await service.createTask(currentUser, "routine-1", {
    sortOrder: 5,
    title: "Keptamaszos feladat",
    customImageExternalUrl: "https://example.com/custom-task.jpg",
    mediaLinks: [
      {
        kind: "IMAGE",
        label: "Minta kep",
        externalUrl: "https://example.com/media-image.jpg",
      },
      {
        kind: "AUDIO",
        label: "Hangminta",
        externalUrl: "https://example.com/audio.mp3",
      },
    ],
  });

  assert.deepEqual(calls.routineFindFirst, [
    {
      where: {
        id: "routine-1",
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

  assert.deepEqual(calls.routineTaskAggregate, [
    {
      where: { routineId: "routine-1" },
      _max: { sortOrder: true },
    },
  ]);

  assert.deepEqual(calls.routineTaskCreate, [
    {
      data: {
        routine: {
          connect: {
            id: "routine-1",
          },
        },
        sortOrder: 5,
        title: "Keptamaszos feladat",
        details: null,
        coachText: null,
        repetitionsLabel: null,
        repetitionCount: null,
        repetitionUnitCount: null,
        catalogTask: undefined,
        catalogDifficultyLevel: undefined,
        song: undefined,
        customImageMedia: {
          create: {
            kind: MediaKind.IMAGE,
            externalUrl: "https://example.com/custom-task.jpg",
          },
        },
        mediaLinks: {
          create: [
            {
              label: "Minta kep",
              sortOrder: 0,
              mediaAsset: {
                create: {
                  kind: MediaKind.IMAGE,
                  externalUrl: "https://example.com/media-image.jpg",
                },
              },
            },
            {
              label: "Hangminta",
              sortOrder: 1,
              mediaAsset: {
                create: {
                  kind: MediaKind.AUDIO,
                  externalUrl: "https://example.com/audio.mp3",
                },
              },
            },
          ],
        },
      },
      include: createRoutineTaskIncludeExpectation(),
    },
  ]);

  assert.deepEqual(result, {
    id: "task-3",
    title: "Keptamaszos feladat",
    details: null,
    coachText: null,
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: null,
  });
});

test("createTask throws when routine is not owned by current user", async () => {
  const { service, currentUser } = createRoutinesTaskHarness({
    ownedRoutine: null,
  });

  await assert.rejects(
    service.createTask(currentUser, "routine-404", {
      sortOrder: 1,
      title: "Labda feldobas",
    }),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Feladatsor nem talalhato.");
      return true;
    },
  );
});

test("updateTask uses owned task lookup and preserves current Prisma update shape", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    ownedTask: {
      id: "task-1",
      routineId: "routine-1",
      customImageMediaId: null,
    },
    updateResult: {
      id: "task-1",
      title: "Frissitett feladat",
      details: null,
      coachText: null,
      repetitionsLabel: null,
      repetitionCount: null,
      repetitionUnitCount: null,
    },
  });

  const result = await service.updateTask(currentUser, "task-1", {
    sortOrder: 2,
    title: "Frissitett feladat",
  });

  assert.deepEqual(calls.routineTaskFindFirst, [
    {
      where: {
        id: "task-1",
        routine: {
          child: {
            ownerId: "parent-1",
          },
        },
      },
      select: {
        id: true,
        routineId: true,
        customImageMediaId: true,
      },
    },
  ]);

  assert.deepEqual(calls.taskMediaLinkDeleteMany, [
    {
      where: { taskId: "task-1" },
    },
  ]);

  assert.deepEqual(calls.routineTaskUpdate, [
    {
      where: { id: "task-1" },
      data: {
        sortOrder: 2,
        title: "Frissitett feladat",
        details: null,
        coachText: null,
        repetitionsLabel: null,
        repetitionCount: null,
        repetitionUnitCount: null,
        catalogTask: { disconnect: true },
        catalogDifficultyLevel: { disconnect: true },
        song: { disconnect: true },
        customImageMedia: undefined,
        mediaLinks: {
          create: [],
        },
      },
      include: createRoutineTaskIncludeExpectation(),
    },
  ]);

  assert.deepEqual(result, {
    id: "task-1",
    title: "Frissitett feladat",
    details: null,
    coachText: null,
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: null,
  });
});

test("updateTask preserves current catalog-connected update path with difficulty and default song fallback", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    ownedTask: {
      id: "task-1",
      routineId: "routine-1",
      customImageMediaId: null,
    },
    catalogTask: {
      id: "catalog-1",
      title: "Katalogus feladat",
      summary: "Frissitett mintaleiras",
      defaultSongId: "song-1",
      defaultSong: { id: "song-1", title: "Mondoka" },
      difficultyLevels: [
        {
          id: "difficulty-1",
          taskCatalogItemId: "catalog-1",
        },
      ],
    },
    difficultyLevel: {
      id: "difficulty-1",
      taskCatalogItemId: "catalog-1",
    },
    song: { id: "song-1" },
    updateResult: {
      id: "task-1",
      title: "Katalogus feladat",
      details: "Frissitett mintaleiras",
      coachText: null,
      repetitionsLabel: null,
      repetitionCount: null,
      repetitionUnitCount: null,
    },
  });

  const result = await service.updateTask(
    currentUser,
    "task-1",
    {
      sortOrder: 3,
      catalogTaskId: "catalog-1",
      catalogDifficultyLevelId: "difficulty-1",
    } as any,
  );

  assert.deepEqual(calls.routineTaskFindFirst, [
    {
      where: {
        id: "task-1",
        routine: {
          child: {
            ownerId: "parent-1",
          },
        },
      },
      select: {
        id: true,
        routineId: true,
        customImageMediaId: true,
      },
    },
  ]);

  assert.deepEqual(calls.taskCatalogItemFindFirst, [
    {
      where: {
        id: "catalog-1",
        isActive: true,
      },
      include: {
        defaultSong: true,
        difficultyLevels: {
          orderBy: { sortOrder: "asc" },
        },
      },
    },
  ]);

  assert.deepEqual(calls.taskCatalogDifficultyLevelFindUnique, [
    {
      where: { id: "difficulty-1" },
    },
  ]);

  assert.deepEqual(calls.songCatalogItemFindFirst, [
    {
      where: {
        id: "song-1",
        isActive: true,
      },
      select: { id: true },
    },
  ]);

  assert.deepEqual(calls.taskMediaLinkDeleteMany, [
    {
      where: { taskId: "task-1" },
    },
  ]);

  assert.deepEqual(calls.routineTaskUpdate, [
    {
      where: { id: "task-1" },
      data: {
        sortOrder: 3,
        title: "Katalogus feladat",
        details: "Frissitett mintaleiras",
        coachText: null,
        repetitionsLabel: null,
        repetitionCount: null,
        repetitionUnitCount: null,
        catalogTask: {
          connect: {
            id: "catalog-1",
          },
        },
        catalogDifficultyLevel: {
          connect: {
            id: "difficulty-1",
          },
        },
        song: {
          connect: {
            id: "song-1",
          },
        },
        customImageMedia: undefined,
        mediaLinks: {
          create: [],
        },
      },
      include: createRoutineTaskIncludeExpectation(),
    },
  ]);

  assert.deepEqual(result, {
    id: "task-1",
    title: "Katalogus feladat",
    details: "Frissitett mintaleiras",
    coachText: null,
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: null,
  });
});

test("updateTask preserves current custom image update and media link replacement shape", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness({
    ownedTask: {
      id: "task-1",
      routineId: "routine-1",
      customImageMediaId: "custom-media-1",
    },
    updateResult: {
      id: "task-1",
      title: "Frissitett kepes feladat",
      details: null,
      coachText: null,
      repetitionsLabel: null,
      repetitionCount: null,
      repetitionUnitCount: null,
    },
  });

  const result = await service.updateTask(currentUser, "task-1", {
    sortOrder: 4,
    title: "Frissitett kepes feladat",
    customImageExternalUrl: "https://example.com/updated-custom.jpg",
    mediaLinks: [
      {
        kind: "VIDEO",
        label: "Videominta",
        externalUrl: "https://example.com/video.mp4",
      },
    ],
  });

  assert.deepEqual(calls.routineTaskFindFirst, [
    {
      where: {
        id: "task-1",
        routine: {
          child: {
            ownerId: "parent-1",
          },
        },
      },
      select: {
        id: true,
        routineId: true,
        customImageMediaId: true,
      },
    },
  ]);

  assert.deepEqual(calls.taskMediaLinkDeleteMany, [
    {
      where: { taskId: "task-1" },
    },
  ]);

  assert.deepEqual(calls.routineTaskUpdate, [
    {
      where: { id: "task-1" },
      data: {
        sortOrder: 4,
        title: "Frissitett kepes feladat",
        details: null,
        coachText: null,
        repetitionsLabel: null,
        repetitionCount: null,
        repetitionUnitCount: null,
        catalogTask: { disconnect: true },
        catalogDifficultyLevel: { disconnect: true },
        song: { disconnect: true },
        customImageMedia: {
          update: {
            kind: MediaKind.IMAGE,
            externalUrl: "https://example.com/updated-custom.jpg",
          },
        },
        mediaLinks: {
          create: [
            {
              label: "Videominta",
              sortOrder: 0,
              mediaAsset: {
                create: {
                  kind: MediaKind.VIDEO,
                  externalUrl: "https://example.com/video.mp4",
                },
              },
            },
          ],
        },
      },
      include: createRoutineTaskIncludeExpectation(),
    },
  ]);

  assert.deepEqual(result, {
    id: "task-1",
    title: "Frissitett kepes feladat",
    details: null,
    coachText: null,
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: null,
  });
});

test("updateTask throws when task is not owned by current user", async () => {
  const { service, currentUser } = createRoutinesTaskHarness({
    ownedTask: null,
  });

  await assert.rejects(
    service.updateTask(currentUser, "task-404", {
      sortOrder: 2,
      title: "Frissitett feladat",
    }),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, "Feladat nem talalhato.");
      return true;
    },
  );
});

test("removeTask uses owned task lookup, preserves Prisma delete behavior, and returns current success shape", async () => {
  const { calls, service, currentUser } = createRoutinesTaskHarness();

  const result = await service.removeTask(currentUser, "task-1");

  assert.deepEqual(calls.routineTaskFindFirst, [
    {
      where: {
        id: "task-1",
        routine: {
          child: {
            ownerId: "parent-1",
          },
        },
      },
      select: {
        id: true,
        routineId: true,
        customImageMediaId: true,
      },
    },
  ]);

  assert.deepEqual(calls.routineTaskDelete, [
    {
      where: { id: "task-1" },
    },
  ]);

  assert.deepEqual(result, { success: true });
});
