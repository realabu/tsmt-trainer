import assert from "node:assert/strict";
import test from "node:test";
import { MediaKind } from "@prisma/client";
import {
  buildRoutineTaskCreateData,
  buildRoutineTaskMediaLinkCreates,
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
