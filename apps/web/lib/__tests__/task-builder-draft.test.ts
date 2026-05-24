import assert from "node:assert/strict";
import test from "node:test";
import type { TaskDraft } from "../../components/task-builder";
import {
  canAddCatalogTask,
  createCatalogTaskDraft,
  createEmptyTaskDraft,
  deriveUsedCatalogTaskIds,
  normalizeTaskDraftOrder,
  type TaskBuilderCatalogTask,
} from "../task-builder-draft";

function task(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
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
    ...overrides,
  };
}

function catalogTask(overrides: Partial<TaskBuilderCatalogTask> = {}): TaskBuilderCatalogTask {
  return {
    id: "catalog-1",
    title: "Katalogus feladat",
    summary: "Katalogus rovid leiras",
    defaultSong: null,
    difficultyLevels: [],
    ...overrides,
  };
}

test("createEmptyTaskDraft preserves current custom task defaults", () => {
  assert.deepEqual(createEmptyTaskDraft(3), {
    sortOrder: 3,
    songSelection: "",
    title: "",
    details: "",
    coachText: "",
    repetitionsLabel: "",
    repetitionCount: "",
    repetitionUnitCount: "",
    mediaImageUrl: "",
    mediaAudioUrl: "",
    mediaVideoUrl: "",
  });
});

test("createCatalogTaskDraft maps current catalog title and summary defaults", () => {
  const result = createCatalogTaskDraft(
    catalogTask({
      id: "catalog-1",
      title: "Labda guritas",
      summary: "Guritsd a labdat.",
    }),
    2,
  );

  assert.equal(result.sortOrder, 2);
  assert.equal(result.catalogTaskId, "catalog-1");
  assert.equal(result.catalogTaskTitle, "Labda guritas");
  assert.equal(result.title, "Labda guritas");
  assert.equal(result.details, "Guritsd a labdat.");
});

test("createCatalogTaskDraft falls back to empty details when summary is nullish", () => {
  assert.equal(createCatalogTaskDraft(catalogTask({ summary: null }), 1).details, "");
  assert.equal(createCatalogTaskDraft(catalogTask({ summary: undefined }), 1).details, "");
});

test('createCatalogTaskDraft selects "__DEFAULT__" when a catalog default song exists', () => {
  const result = createCatalogTaskDraft(
    catalogTask({
      defaultSong: {
        id: "song-1",
        title: "Tavaszi dal",
      },
    }),
    1,
  );

  assert.equal(result.catalogDefaultSongId, "song-1");
  assert.equal(result.catalogDefaultSongTitle, "Tavaszi dal");
  assert.equal(result.songSelection, "__DEFAULT__");
});

test("createCatalogTaskDraft keeps empty songSelection when no default song exists", () => {
  const result = createCatalogTaskDraft(catalogTask({ defaultSong: null }), 1);

  assert.equal(result.catalogDefaultSongId, undefined);
  assert.equal(result.catalogDefaultSongTitle, undefined);
  assert.equal(result.songSelection, "");
});

test("createCatalogTaskDraft preserves catalog difficulty metadata", () => {
  const difficultyLevels = [
    { id: "easy", name: "Konnyu", description: null },
    { id: "hard", name: "Nehez", description: "Halado" },
  ];

  const result = createCatalogTaskDraft(catalogTask({ difficultyLevels }), 1);

  assert.deepEqual(result.catalogDifficultyLevels, difficultyLevels);
  assert.equal(result.catalogDifficultyLevelId, undefined);
});

test("createCatalogTaskDraft does not copy catalog preview media into draft media fields", () => {
  const result = createCatalogTaskDraft(catalogTask(), 1);

  assert.equal(result.mediaImageUrl, "");
  assert.equal(result.mediaAudioUrl, "");
  assert.equal(result.mediaVideoUrl, "");
});

test("normalizeTaskDraftOrder rewrites sortOrder in current list order", () => {
  const result = normalizeTaskDraftOrder([
    task({ id: "task-2", sortOrder: 99, title: "Second became first" }),
    task({ title: "New second", sortOrder: 42 }),
    task({ id: "task-1", sortOrder: 1, title: "First became third" }),
  ]);

  assert.deepEqual(
    result.map((item) => ({ id: item.id, title: item.title, sortOrder: item.sortOrder })),
    [
      { id: "task-2", title: "Second became first", sortOrder: 1 },
      { id: undefined, title: "New second", sortOrder: 2 },
      { id: "task-1", title: "First became third", sortOrder: 3 },
    ],
  );
});

test("normalizeTaskDraftOrder preserves other task fields", () => {
  const result = normalizeTaskDraftOrder([
    task({
      catalogTaskId: "catalog-1",
      catalogDefaultSongId: "song-1",
      songSelection: "__DEFAULT__",
      mediaAudioUrl: "https://example.com/audio.mp3",
      sortOrder: 10,
    }),
  ]);

  assert.equal(result[0]?.catalogTaskId, "catalog-1");
  assert.equal(result[0]?.catalogDefaultSongId, "song-1");
  assert.equal(result[0]?.songSelection, "__DEFAULT__");
  assert.equal(result[0]?.mediaAudioUrl, "https://example.com/audio.mp3");
  assert.equal(result[0]?.sortOrder, 1);
});

test("deriveUsedCatalogTaskIds ignores custom tasks and drafts without catalog ids", () => {
  const result = deriveUsedCatalogTaskIds([
    task({ catalogTaskId: "catalog-1" }),
    task({ catalogTaskId: undefined }),
    task({ catalogTaskId: "" }),
    task({ catalogTaskId: "catalog-2" }),
  ]);

  assert.deepEqual(Array.from(result).sort(), ["catalog-1", "catalog-2"]);
});

test("canAddCatalogTask rejects already used catalog tasks", () => {
  const tasks = [task({ catalogTaskId: "catalog-1" }), task()];

  assert.equal(canAddCatalogTask(tasks, "catalog-1"), false);
  assert.equal(canAddCatalogTask(tasks, "catalog-2"), true);
});
