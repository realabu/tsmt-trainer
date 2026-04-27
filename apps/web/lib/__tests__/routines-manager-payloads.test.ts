import assert from "node:assert/strict";
import test from "node:test";
import { buildCreateRoutinePayload, buildRoutinePeriodPayload, buildRoutineTaskPayload } from "../routines-manager-payloads";

test("task payload preserves explicit fields", () => {
  const result = buildRoutineTaskPayload(
    {
      sortOrder: 99,
      catalogTaskId: "catalog-1",
      catalogDifficultyLevelId: "difficulty-1",
      songSelection: "song-1",
      title: "Labda",
      details: "Leiras",
      coachText: "Coach",
      repetitionsLabel: "2x10",
      repetitionCount: "2",
      repetitionUnitCount: "10",
      mediaImageUrl: "https://example.com/image.png",
      mediaAudioUrl: "https://example.com/audio.mp3",
      mediaVideoUrl: "https://example.com/video.mp4",
    },
    3,
  );

  assert.deepEqual(result, {
    sortOrder: 3,
    catalogTaskId: "catalog-1",
    catalogDifficultyLevelId: "difficulty-1",
    songId: "song-1",
    title: "Labda",
    details: "Leiras",
    coachText: "Coach",
    repetitionsLabel: "2x10",
    repetitionCount: 2,
    repetitionUnitCount: 10,
    customImageExternalUrl: "https://example.com/image.png",
    mediaLinks: [
      { kind: "AUDIO", label: "Feladat hang", externalUrl: "https://example.com/audio.mp3" },
      { kind: "VIDEO", label: "Feladat video", externalUrl: "https://example.com/video.mp4" },
    ],
  });
});

test('"__DEFAULT__" songSelection maps to undefined', () => {
  const result = buildRoutineTaskPayload(
    {
      sortOrder: 1,
      songSelection: "__DEFAULT__",
      title: "Task",
      details: "",
      coachText: "",
      repetitionsLabel: "",
      repetitionCount: "",
      repetitionUnitCount: "",
      mediaImageUrl: "",
      mediaAudioUrl: "",
      mediaVideoUrl: "",
    },
    1,
  );

  assert.equal(result.songId, undefined);
});

test("audio/video mediaLinks are shaped in current order with current labels", () => {
  const result = buildRoutineTaskPayload(
    {
      sortOrder: 1,
      songSelection: "",
      title: "Task",
      details: "",
      coachText: "",
      repetitionsLabel: "",
      repetitionCount: "",
      repetitionUnitCount: "",
      mediaImageUrl: "",
      mediaAudioUrl: "https://example.com/audio.mp3",
      mediaVideoUrl: "https://example.com/video.mp4",
    },
    1,
  );

  assert.deepEqual(result.mediaLinks, [
    { kind: "AUDIO", label: "Feladat hang", externalUrl: "https://example.com/audio.mp3" },
    { kind: "VIDEO", label: "Feladat video", externalUrl: "https://example.com/video.mp4" },
  ]);
});

test("missing media urls produce filtered mediaLinks", () => {
  const result = buildRoutineTaskPayload(
    {
      sortOrder: 1,
      songSelection: "",
      title: "Task",
      details: "",
      coachText: "",
      repetitionsLabel: "",
      repetitionCount: "",
      repetitionUnitCount: "",
      mediaImageUrl: "",
      mediaAudioUrl: "",
      mediaVideoUrl: "",
    },
    1,
  );

  assert.deepEqual(result.mediaLinks, []);
});

test("create routine payload includes childId, name, description, tasks, defaultPeriods", () => {
  const result = buildCreateRoutinePayload({
    childId: "child-1",
    name: "Feladatsor",
    description: "Leiras",
    tasks: [
      {
        sortOrder: 1,
        songSelection: "",
        title: "Task",
        details: "",
        coachText: "",
        repetitionsLabel: "",
        repetitionCount: "",
        repetitionUnitCount: "",
        mediaImageUrl: "",
        mediaAudioUrl: "",
        mediaVideoUrl: "",
      },
    ],
  });

  assert.equal(result.childId, "child-1");
  assert.equal(result.name, "Feladatsor");
  assert.equal(result.description, "Leiras");
  assert.equal(result.tasks.length, 1);
  assert.deepEqual(result.periods, [
    {
      name: "Indulo szakasz",
      startsOn: "2026-04-01",
      endsOn: "2026-04-21",
      weeklyTargetCount: 3,
    },
  ]);
});

test("period payload preserves date fields and parses weeklyTargetCount with current fallback", () => {
  const result = buildRoutinePeriodPayload({
    id: "period-1",
    name: "Elso",
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    weeklyTargetCount: "5",
  });

  assert.deepEqual(result, {
    name: "Elso",
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    weeklyTargetCount: 5,
  });
});

test("empty optional string behavior remains unchanged", () => {
  const result = buildRoutinePeriodPayload({
    name: "",
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    weeklyTargetCount: "",
  });

  assert.deepEqual(result, {
    name: undefined,
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    weeklyTargetCount: 1,
  });
});
