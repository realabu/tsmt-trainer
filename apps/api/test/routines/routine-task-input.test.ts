import assert from "node:assert/strict";
import test from "node:test";
import { MediaKind } from "@prisma/client";
import {
  buildResolvedRoutineTaskInput,
  buildRoutineTaskCrudCreateData,
  buildRoutineTaskCrudUpdateData,
  buildRoutineTaskCreateData,
  buildRoutineTaskMediaLinkCreates,
  isRoutineTaskDifficultyCompatibleWithCatalogTask,
  isRoutineTaskTitleUsable,
} from "../../src/routines/domain/routine-task-input";

test("task create mapping preserves explicit fields exactly", () => {
  const result = buildRoutineTaskCreateData({
    sortOrder: 3,
    catalogTaskId: "catalog-1",
    catalogDifficultyLevelId: "difficulty-1",
    songId: "song-1",
    title: "Labda feldobas",
    details: "",
    coachText: null,
    repetitionsLabel: "2x10",
    repetitionCount: 2,
    repetitionUnitCount: 10,
    customImageExternalUrl: "https://example.com/custom.jpg",
    mediaLinks: [],
  });

  assert.equal(result.sortOrder, 3);
  assert.equal(result.catalogTaskId, "catalog-1");
  assert.equal(result.catalogDifficultyLevelId, "difficulty-1");
  assert.equal(result.songId, "song-1");
  assert.equal(result.title, "Labda feldobas");
  assert.equal(result.details, "");
  assert.equal(result.coachText, null);
  assert.equal(result.repetitionsLabel, "2x10");
  assert.equal(result.repetitionCount, 2);
  assert.equal(result.repetitionUnitCount, 10);
  assert.deepEqual(result.customImageMedia, {
    create: {
      kind: MediaKind.IMAGE,
      externalUrl: "https://example.com/custom.jpg",
    },
  });
  assert.deepEqual(result.mediaLinks, { create: [] });
});

test("task create mapping preserves null and undefined behavior", () => {
  const result = buildRoutineTaskCreateData({
    sortOrder: 0,
    catalogTaskId: null,
    catalogDifficultyLevelId: null,
    songId: null,
    title: "Hinta",
    details: undefined,
    coachText: "",
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: null,
    customImageExternalUrl: null,
    mediaLinks: [],
  });

  assert.equal(result.sortOrder, 1);
  assert.equal(result.catalogTaskId, null);
  assert.equal(result.catalogDifficultyLevelId, null);
  assert.equal(result.songId, null);
  assert.equal(result.details, undefined);
  assert.equal(result.coachText, "");
  assert.equal(result.customImageMedia, undefined);
});

test("media links are shaped in the same order", () => {
  const result = buildRoutineTaskMediaLinkCreates([
    {
      kind: "AUDIO",
      label: "Elso",
      externalUrl: "https://example.com/1.mp3",
    },
    {
      kind: "VIDEO",
      label: "Masodik",
      externalUrl: "https://example.com/2.mp4",
    },
  ]);

  assert.deepEqual(result, [
    {
      label: "Elso",
      sortOrder: 0,
      mediaAsset: {
        create: {
          kind: MediaKind.AUDIO,
          externalUrl: "https://example.com/1.mp3",
        },
      },
    },
    {
      label: "Masodik",
      sortOrder: 1,
      mediaAsset: {
        create: {
          kind: MediaKind.VIDEO,
          externalUrl: "https://example.com/2.mp4",
        },
      },
    },
  ]);
});

test("empty media links behavior remains unchanged", () => {
  assert.deepEqual(buildRoutineTaskMediaLinkCreates([]), []);
});

test("resolved task input preserves current null, undefined, and fallback behavior", () => {
  const result = buildResolvedRoutineTaskInput(
    {
      sortOrder: undefined,
      catalogTaskId: "",
      catalogDifficultyLevelId: undefined,
      repetitionCount: undefined,
      repetitionUnitCount: 10,
      customImageExternalUrl: "",
      mediaLinks: undefined,
    },
    4,
    {
      title: "Labda feldobas",
      details: undefined,
      coachText: "",
    },
    undefined,
    null,
  );

  assert.deepEqual(result, {
    sortOrder: 4,
    catalogTaskId: null,
    catalogDifficultyLevelId: null,
    songId: null,
    title: "Labda feldobas",
    details: undefined,
    coachText: "",
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: 10,
    customImageExternalUrl: null,
    mediaLinks: [],
  });
});

test("resolved task input preserves explicit values exactly", () => {
  const result = buildResolvedRoutineTaskInput(
    {
      sortOrder: 7,
      catalogTaskId: "catalog-1",
      catalogDifficultyLevelId: "difficulty-1",
      repetitionCount: 2,
      repetitionUnitCount: 10,
      customImageExternalUrl: "https://example.com/custom.jpg",
      mediaLinks: [
        {
          kind: "IMAGE",
          label: "Mutatott kep",
          externalUrl: "https://example.com/image.jpg",
        },
      ],
    },
    4,
    {
      title: "Labda feldobas",
      details: "",
      coachText: null,
    },
    "song-1",
    "2x10",
  );

  assert.deepEqual(result, {
    sortOrder: 7,
    catalogTaskId: "catalog-1",
    catalogDifficultyLevelId: "difficulty-1",
    songId: "song-1",
    title: "Labda feldobas",
    details: "",
    coachText: null,
    repetitionsLabel: "2x10",
    repetitionCount: 2,
    repetitionUnitCount: 10,
    customImageExternalUrl: "https://example.com/custom.jpg",
    mediaLinks: [
      {
        kind: "IMAGE",
        label: "Mutatott kep",
        externalUrl: "https://example.com/image.jpg",
      },
    ],
  });
});

test("task difficulty compatibility returns true when difficulty belongs to catalog task", () => {
  assert.equal(
    isRoutineTaskDifficultyCompatibleWithCatalogTask("catalog-1", "catalog-1"),
    true,
  );
});

test("task difficulty compatibility returns false for a different catalog task", () => {
  assert.equal(
    isRoutineTaskDifficultyCompatibleWithCatalogTask("catalog-1", "catalog-other"),
    false,
  );
});

test("task difficulty compatibility returns false when catalog task is missing", () => {
  assert.equal(
    isRoutineTaskDifficultyCompatibleWithCatalogTask(null, "catalog-1"),
    false,
  );
});

test("task difficulty compatibility returns false when difficulty catalog reference is missing", () => {
  assert.equal(
    isRoutineTaskDifficultyCompatibleWithCatalogTask("catalog-1", undefined),
    false,
  );
});

test("task title usability returns true for a normal non-empty title", () => {
  assert.equal(isRoutineTaskTitleUsable("Labda feldobas"), true);
});

test("task title usability returns false for null", () => {
  assert.equal(isRoutineTaskTitleUsable(null), false);
});

test("task title usability returns false for undefined", () => {
  assert.equal(isRoutineTaskTitleUsable(undefined), false);
});

test("task title usability returns false for empty string", () => {
  assert.equal(isRoutineTaskTitleUsable(""), false);
});

test("task CRUD create data preserves current relation connect/create shape", () => {
  const result = buildRoutineTaskCrudCreateData("routine-1", 5, {
    sortOrder: 7,
    catalogTaskId: "catalog-1",
    catalogDifficultyLevelId: "difficulty-1",
    songId: "song-1",
    title: "Labda feldobas",
    details: "",
    coachText: null,
    repetitionsLabel: "2x10",
    repetitionCount: 2,
    repetitionUnitCount: 10,
    customImageExternalUrl: "https://example.com/custom.jpg",
    mediaLinks: [
      {
        kind: "IMAGE",
        label: "Mutatott kep",
        externalUrl: "https://example.com/image.jpg",
      },
    ],
  });

  assert.deepEqual(result, {
    routine: {
      connect: {
        id: "routine-1",
      },
    },
    sortOrder: 5,
    title: "Labda feldobas",
    details: "",
    coachText: null,
    repetitionsLabel: "2x10",
    repetitionCount: 2,
    repetitionUnitCount: 10,
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
    customImageMedia: {
      create: {
        kind: MediaKind.IMAGE,
        externalUrl: "https://example.com/custom.jpg",
      },
    },
    mediaLinks: {
      create: [
        {
          label: "Mutatott kep",
          sortOrder: 0,
          mediaAsset: {
            create: {
              kind: MediaKind.IMAGE,
              externalUrl: "https://example.com/image.jpg",
            },
          },
        },
      ],
    },
  });
});

test("task CRUD create data preserves undefined relation branches for minimal path", () => {
  const result = buildRoutineTaskCrudCreateData("routine-1", 1, {
    sortOrder: 1,
    catalogTaskId: null,
    catalogDifficultyLevelId: null,
    songId: null,
    title: "Hinta",
    details: null,
    coachText: null,
    repetitionsLabel: null,
    repetitionCount: null,
    repetitionUnitCount: null,
    customImageExternalUrl: null,
    mediaLinks: [],
  });

  assert.deepEqual(result, {
    routine: {
      connect: {
        id: "routine-1",
      },
    },
    sortOrder: 1,
    title: "Hinta",
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
  });
});

test("task CRUD update data preserves disconnect branches for minimal path", () => {
  const result = buildRoutineTaskCrudUpdateData(
    {
      sortOrder: 2,
      catalogTaskId: null,
      catalogDifficultyLevelId: null,
      songId: null,
      title: "Hinta",
      details: null,
      coachText: null,
      repetitionsLabel: null,
      repetitionCount: null,
      repetitionUnitCount: null,
      customImageExternalUrl: null,
      mediaLinks: [],
    },
    null,
  );

  assert.deepEqual(result, {
    sortOrder: 2,
    title: "Hinta",
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
  });
});

test("task CRUD update data preserves connect branches for catalog-connected path", () => {
  const result = buildRoutineTaskCrudUpdateData(
    {
      sortOrder: 3,
      catalogTaskId: "catalog-1",
      catalogDifficultyLevelId: "difficulty-1",
      songId: "song-1",
      title: "Katalogus feladat",
      details: "Mintaleiras",
      coachText: null,
      repetitionsLabel: null,
      repetitionCount: null,
      repetitionUnitCount: null,
      customImageExternalUrl: null,
      mediaLinks: [],
    },
    null,
  );

  assert.deepEqual(result, {
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
  });
});

test("task CRUD update data preserves existing custom image disconnect branch", () => {
  const result = buildRoutineTaskCrudUpdateData(
    {
      sortOrder: 4,
      catalogTaskId: null,
      catalogDifficultyLevelId: null,
      songId: null,
      title: "Labda feldobas",
      details: "",
      coachText: null,
      repetitionsLabel: "2x10",
      repetitionCount: 2,
      repetitionUnitCount: 10,
      customImageExternalUrl: null,
      mediaLinks: [],
    },
    "media-1",
  );

  assert.deepEqual(result, {
    sortOrder: 4,
    title: "Labda feldobas",
    details: "",
    coachText: null,
    repetitionsLabel: "2x10",
    repetitionCount: 2,
    repetitionUnitCount: 10,
    catalogTask: { disconnect: true },
    catalogDifficultyLevel: { disconnect: true },
    song: { disconnect: true },
    customImageMedia: { disconnect: true },
    mediaLinks: {
      create: [],
    },
  });
});
