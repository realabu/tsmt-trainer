import assert from "node:assert/strict";
import test from "node:test";
import { buildTrainingRunnerViewModel } from "../training-runner-view-model";

function makeTask(overrides: Partial<Parameters<typeof buildTrainingRunnerViewModel>[0]["tasks"][number]> = {}) {
  return {
    id: "task-1",
    sortOrder: 1,
    title: "Elso task",
    details: "Leiras",
    coachText: "Coach",
    repetitionsLabel: "2x",
    repetitionCount: 2,
    repetitionUnitCount: null,
    mediaLinks: [],
    catalogTask: {
      summary: "Katalogus leiras",
      demoVideoUrl: null,
      defaultSong: null,
      mediaLinks: [],
      equipmentLinks: [],
    },
    ...overrides,
  };
}

test("null/no current task behavior is preserved when completedCount is past the task list", () => {
  const result = buildTrainingRunnerViewModel({
    tasks: [makeTask()],
    completedCount: 1,
    totalTaskCount: 1,
    isFinished: true,
    activeImageIndex: null,
  });

  assert.equal(result.currentTask, null);
  assert.equal(result.nextTask, null);
  assert.deepEqual(result.currentTaskImages, []);
  assert.equal(result.selectedImage, null);
  assert.equal(result.currentTaskRepetitionsLabel, "");
  assert.equal(result.progressPercent, 100);
  assert.equal(result.finishActionLabel, "Uj torna inditasa");
});

test("first task progress metadata is correct", () => {
  const result = buildTrainingRunnerViewModel({
    tasks: [makeTask(), makeTask({ id: "task-2", sortOrder: 2, title: "Masodik task" })],
    completedCount: 0,
    totalTaskCount: 2,
    isFinished: false,
    activeImageIndex: null,
  });

  assert.equal(result.currentTask?.id, "task-1");
  assert.equal(result.nextTask?.id, "task-2");
  assert.equal(result.progressPercent, 0);
  assert.equal(result.finishActionLabel, "Kovetkezo feladat");
});

test("middle and last task progress metadata is correct", () => {
  const tasks = [
    makeTask(),
    makeTask({ id: "task-2", sortOrder: 2, title: "Masodik task" }),
    makeTask({ id: "task-3", sortOrder: 3, title: "Harmadik task" }),
  ];

  const middle = buildTrainingRunnerViewModel({
    tasks,
    completedCount: 1,
    totalTaskCount: 3,
    isFinished: false,
    activeImageIndex: null,
  });
  assert.equal(middle.currentTask?.id, "task-2");
  assert.equal(middle.nextTask?.id, "task-3");
  assert.equal(middle.progressPercent, 33);

  const last = buildTrainingRunnerViewModel({
    tasks,
    completedCount: 2,
    totalTaskCount: 3,
    isFinished: false,
    activeImageIndex: null,
  });
  assert.equal(last.currentTask?.id, "task-3");
  assert.equal(last.nextTask, null);
  assert.equal(last.finishActionLabel, "Torna befejezese");
  assert.equal(last.progressPercent, 67);
});

test("preserves coach/details and song/equipment fallbacks in the current task view model", () => {
  const result = buildTrainingRunnerViewModel({
    tasks: [
      makeTask({
        coachText: null,
        details: "",
        song: null,
        catalogTask: {
          summary: "Katalogus leiras",
          demoVideoUrl: "https://example.com/demo.mp4",
          defaultSong: {
            id: "song-1",
            title: "Dal",
            notes: "Jegyzet",
          },
          mediaLinks: [],
          equipmentLinks: [
            {
              equipmentCatalogItem: {
                id: "eq-1",
                name: "Labda",
              },
            },
          ],
        },
      }),
    ],
    completedCount: 0,
    totalTaskCount: 1,
    isFinished: false,
    activeImageIndex: null,
  });

  assert.equal(result.currentTask?.details, "");
  assert.equal(result.currentTask?.coachText, null);
  assert.equal(result.effectiveSong?.id, "song-1");
  assert.equal(result.demoVideoUrl, "https://example.com/demo.mp4");
  assert.equal(result.equipment.length, 1);
  assert.equal(result.currentTaskRepetitionsLabel, "2x");
});

test("selected image comes from the already extracted image helper behavior", () => {
  const result = buildTrainingRunnerViewModel({
    tasks: [
      makeTask({
        customImageMedia: { externalUrl: "https://example.com/custom.png" },
        mediaLinks: [
          {
            id: "media-1",
            label: "Masik",
            mediaAsset: {
              kind: "IMAGE",
              externalUrl: "https://example.com/other.png",
            },
          },
        ],
      }),
    ],
    completedCount: 0,
    totalTaskCount: 1,
    isFinished: false,
    activeImageIndex: 1,
  });

  assert.equal(result.currentTaskImages.length, 2);
  assert.deepEqual(result.selectedImage, {
    key: "media-1",
    label: "Masik",
    url: "https://example.com/other.png",
  });
});
