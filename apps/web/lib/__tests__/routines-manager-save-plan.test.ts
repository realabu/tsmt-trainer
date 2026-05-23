import assert from "node:assert/strict";
import test from "node:test";
import type { TaskDraft } from "../../components/task-builder";
import {
  buildRoutineEditorSavePlan,
  type RoutineEditorPeriodDraft,
  type RoutineEditorSaveOperation,
} from "../routines-manager-save-plan";

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

function period(overrides: Partial<RoutineEditorPeriodDraft> = {}): RoutineEditorPeriodDraft {
  return {
    name: "Idoszak",
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    weeklyTargetCount: "3",
    ...overrides,
  };
}

function operationAt<TType extends RoutineEditorSaveOperation["type"]>(
  operations: RoutineEditorSaveOperation[],
  index: number,
  type: TType,
): Extract<RoutineEditorSaveOperation, { type: TType }> {
  const operation = operations[index];
  assert.ok(operation);
  assert.equal(operation.type, type);
  return operation as Extract<RoutineEditorSaveOperation, { type: TType }>;
}

test("plans routine update first and detects no removals when persisted ids remain", () => {
  const result = buildRoutineEditorSavePlan({
    routineId: "routine-1",
    name: "Feladatsor",
    description: "Leiras",
    tasks: [task({ id: "task-1" })],
    periods: [period({ id: "period-1" })],
    originalTaskIds: ["task-1"],
    originalPeriodIds: ["period-1"],
  });

  assert.deepEqual(result.removedTaskIds, []);
  assert.deepEqual(result.removedPeriodIds, []);
  assert.deepEqual(result.operations[0], {
    type: "updateRoutine",
    endpoint: "/api/routines/routine-1",
    method: "PATCH",
    payload: {
      name: "Feladatsor",
      description: "Leiras",
    },
  });
});

test("detects removed persisted task and period ids before write operations", () => {
  const result = buildRoutineEditorSavePlan({
    routineId: "routine-1",
    name: "Feladatsor",
    description: "",
    tasks: [task({ id: "task-kept" })],
    periods: [period({ id: "period-kept" })],
    originalTaskIds: ["task-removed", "task-kept"],
    originalPeriodIds: ["period-removed", "period-kept"],
  });

  assert.deepEqual(result.removedTaskIds, ["task-removed"]);
  assert.deepEqual(result.removedPeriodIds, ["period-removed"]);
  assert.deepEqual(
    result.operations.map((operation) => operation.type),
    ["updateRoutine", "deleteTask", "updateTask", "deletePeriod", "updatePeriod"],
  );
  assert.equal(operationAt(result.operations, 1, "deleteTask").endpoint, "/api/routines/tasks/task-removed");
  assert.equal(operationAt(result.operations, 3, "deletePeriod").endpoint, "/api/routines/periods/period-removed");
});

test("plans existing and new tasks in current editor order with current sortOrder semantics", () => {
  const result = buildRoutineEditorSavePlan({
    routineId: "routine-1",
    name: "Feladatsor",
    description: "",
    tasks: [
      task({ id: "task-2", title: "Second became first", sortOrder: 99 }),
      task({
        title: "New second",
        songSelection: "__DEFAULT__",
        mediaAudioUrl: "https://example.com/audio.mp3",
      }),
      task({ id: "task-1", title: "First became third" }),
    ],
    periods: [],
    originalTaskIds: ["task-1", "task-2"],
    originalPeriodIds: [],
  });

  assert.deepEqual(
    result.operations.map((operation) => operation.type),
    ["updateRoutine", "updateTask", "createTask", "updateTask"],
  );

  const firstTask = operationAt(result.operations, 1, "updateTask");
  const secondTask = operationAt(result.operations, 2, "createTask");
  const thirdTask = operationAt(result.operations, 3, "updateTask");

  assert.equal(firstTask.endpoint, "/api/routines/tasks/task-2");
  assert.equal(firstTask.payload.sortOrder, 1);
  assert.equal(firstTask.payload.title, "Second became first");

  assert.equal(secondTask.endpoint, "/api/routines/routine-1/tasks");
  assert.equal(secondTask.payload.sortOrder, 2);
  assert.equal(secondTask.payload.songId, undefined);
  assert.deepEqual(secondTask.payload.mediaLinks, [
    { kind: "AUDIO", label: "Feladat hang", externalUrl: "https://example.com/audio.mp3" },
  ]);

  assert.equal(thirdTask.endpoint, "/api/routines/tasks/task-1");
  assert.equal(thirdTask.payload.sortOrder, 3);
  assert.equal(thirdTask.payload.title, "First became third");
});

test("plans existing and new periods in current save order with current payload fallback", () => {
  const result = buildRoutineEditorSavePlan({
    routineId: "routine-1",
    name: "Feladatsor",
    description: "",
    tasks: [],
    periods: [
      period({ id: "period-2", name: "Masodik", weeklyTargetCount: "5" }),
      period({ name: "", weeklyTargetCount: "" }),
      period({ id: "period-1", name: "Elso", startsOn: "2026-05-01", endsOn: "2026-05-31" }),
    ],
    originalTaskIds: [],
    originalPeriodIds: ["period-1", "period-2"],
  });

  assert.deepEqual(
    result.operations.map((operation) => operation.type),
    ["updateRoutine", "updatePeriod", "createPeriod", "updatePeriod"],
  );

  const firstPeriod = operationAt(result.operations, 1, "updatePeriod");
  const secondPeriod = operationAt(result.operations, 2, "createPeriod");
  const thirdPeriod = operationAt(result.operations, 3, "updatePeriod");

  assert.equal(firstPeriod.endpoint, "/api/routines/periods/period-2");
  assert.deepEqual(firstPeriod.payload, {
    name: "Masodik",
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    weeklyTargetCount: 5,
  });

  assert.equal(secondPeriod.endpoint, "/api/routines/routine-1/periods");
  assert.deepEqual(secondPeriod.payload, {
    name: undefined,
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    weeklyTargetCount: 1,
  });

  assert.equal(thirdPeriod.endpoint, "/api/routines/periods/period-1");
  assert.deepEqual(thirdPeriod.payload, {
    name: "Elso",
    startsOn: "2026-05-01",
    endsOn: "2026-05-31",
    weeklyTargetCount: 3,
  });
});

test("ignores empty new ids when detecting removed persisted ids", () => {
  const result = buildRoutineEditorSavePlan({
    routineId: "routine-1",
    name: "Feladatsor",
    description: "",
    tasks: [task({ id: "" }), task({ id: undefined })],
    periods: [period({ id: "" }), period({ id: undefined })],
    originalTaskIds: ["task-removed"],
    originalPeriodIds: ["period-removed"],
  });

  assert.deepEqual(result.removedTaskIds, ["task-removed"]);
  assert.deepEqual(result.removedPeriodIds, ["period-removed"]);
  assert.deepEqual(
    result.operations.map((operation) => operation.type),
    ["updateRoutine", "deleteTask", "createTask", "createTask", "deletePeriod", "createPeriod", "createPeriod"],
  );
});
