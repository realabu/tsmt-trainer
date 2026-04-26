import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultPeriods,
  parseOptionalInt,
  routinePeriodToDraft,
  routineTaskToDraft,
} from "../routines-manager-helpers";

test("parseOptionalInt returns undefined for empty string", () => {
  assert.equal(parseOptionalInt(""), undefined);
});

test("parseOptionalInt returns undefined for whitespace", () => {
  assert.equal(parseOptionalInt("   "), undefined);
});

test("parseOptionalInt returns number for valid integer string", () => {
  assert.equal(parseOptionalInt("42"), 42);
});

test("parseOptionalInt returns undefined for invalid string", () => {
  assert.equal(parseOptionalInt("abc"), undefined);
});

test("routineTaskToDraft maps basic fields", () => {
  const result = routineTaskToDraft(
    {
      id: "task-1",
      sortOrder: 3,
      title: "Labda dobas",
      details: "Leiras",
      coachText: "Coach",
      repetitionsLabel: "2x10",
      repetitionCount: 2,
      repetitionUnitCount: 10,
    },
    0,
  );

  assert.equal(result.id, "task-1");
  assert.equal(result.sortOrder, 3);
  assert.equal(result.title, "Labda dobas");
  assert.equal(result.details, "Leiras");
  assert.equal(result.coachText, "Coach");
  assert.equal(result.repetitionsLabel, "2x10");
  assert.equal(result.repetitionCount, "2");
  assert.equal(result.repetitionUnitCount, "10");
});

test("routineTaskToDraft extracts custom image media first", () => {
  const result = routineTaskToDraft(
    {
      id: "task-1",
      sortOrder: 1,
      title: "Task",
      customImageMedia: { externalUrl: "https://example.com/custom.png" },
      mediaLinks: [
        {
          id: "media-1",
          mediaAsset: { kind: "IMAGE", externalUrl: "https://example.com/fallback.png" },
        },
      ],
    },
    0,
  );

  assert.equal(result.mediaImageUrl, "https://example.com/custom.png");
});

test("routineTaskToDraft falls back to IMAGE mediaLink when no custom image", () => {
  const result = routineTaskToDraft(
    {
      id: "task-1",
      sortOrder: 1,
      title: "Task",
      mediaLinks: [
        {
          id: "media-1",
          mediaAsset: { kind: "IMAGE", externalUrl: "https://example.com/fallback.png" },
        },
      ],
    },
    0,
  );

  assert.equal(result.mediaImageUrl, "https://example.com/fallback.png");
});

test("routineTaskToDraft extracts AUDIO and VIDEO media links", () => {
  const result = routineTaskToDraft(
    {
      id: "task-1",
      sortOrder: 1,
      title: "Task",
      mediaLinks: [
        {
          id: "audio-1",
          mediaAsset: { kind: "AUDIO", externalUrl: "https://example.com/audio.mp3" },
        },
        {
          id: "video-1",
          mediaAsset: { kind: "VIDEO", externalUrl: "https://example.com/video.mp4" },
        },
      ],
    },
    0,
  );

  assert.equal(result.mediaAudioUrl, "https://example.com/audio.mp3");
  assert.equal(result.mediaVideoUrl, "https://example.com/video.mp4");
});

test("routineTaskToDraft maps catalog task metadata", () => {
  const result = routineTaskToDraft(
    {
      id: "task-1",
      sortOrder: 1,
      title: "Task",
      catalogTaskId: "catalog-1",
      catalogTask: {
        id: "catalog-1",
        title: "Catalog task",
        defaultSong: {
          id: "song-1",
          title: "Dal",
        },
        difficultyLevels: [{ id: "diff-1", name: "Konnyu" }],
      },
      catalogDifficultyLevel: { id: "diff-1" },
    },
    0,
  );

  assert.equal(result.catalogTaskId, "catalog-1");
  assert.equal(result.catalogTaskTitle, "Catalog task");
  assert.equal(result.catalogDefaultSongId, "song-1");
  assert.equal(result.catalogDefaultSongTitle, "Dal");
  assert.deepEqual(result.catalogDifficultyLevels, [{ id: "diff-1", name: "Konnyu" }]);
  assert.equal(result.catalogDifficultyLevelId, "diff-1");
});

test('routineTaskToDraft maps "__DEFAULT__" when selected song equals catalog default', () => {
  const result = routineTaskToDraft(
    {
      id: "task-1",
      sortOrder: 1,
      title: "Task",
      song: { id: "song-1", title: "Dal" },
      catalogTask: {
        id: "catalog-1",
        title: "Catalog task",
        defaultSong: { id: "song-1", title: "Dal" },
      },
    },
    0,
  );

  assert.equal(result.songSelection, "__DEFAULT__");
});

test("routineTaskToDraft maps no selected song to empty string", () => {
  const result = routineTaskToDraft(
    {
      id: "task-1",
      sortOrder: 1,
      title: "Task",
      song: null,
      catalogTask: {
        id: "catalog-1",
        title: "Catalog task",
        defaultSong: { id: "song-1", title: "Dal" },
      },
    },
    0,
  );

  assert.equal(result.songSelection, "");
});

test("routineTaskToDraft preserves repetitionsLabel fallback behavior", () => {
  const result = routineTaskToDraft(
    {
      id: "task-1",
      sortOrder: 1,
      title: "Task",
      repetitionsLabel: null,
      repetitionCount: 2,
      repetitionUnitCount: 10,
    },
    0,
  );

  assert.equal(result.repetitionsLabel, "2x10");
});

test("routinePeriodToDraft maps id and normalized name", () => {
  const result = routinePeriodToDraft({
    id: "period-1",
    name: null,
    startsOn: "2026-04-01T12:34:56.000Z",
    endsOn: "2026-04-21T23:59:59.999Z",
    weeklyTargetCount: 3,
  });

  assert.deepEqual(result, {
    id: "period-1",
    name: "",
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    weeklyTargetCount: "3",
  });
});

test("defaultPeriods preserves existing shape and values", () => {
  assert.deepEqual(defaultPeriods, [
    {
      name: "Indulo szakasz",
      startsOn: "2026-04-01",
      endsOn: "2026-04-21",
      weeklyTargetCount: 3,
    },
  ]);
});
