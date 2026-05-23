import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCompleteTaskPayload,
  getSessionControlErrorMessage,
  getSessionControlSuccessMessage,
  shouldFinishAfterTask,
} from "../training-runner-session-control";

test("buildCompleteTaskPayload preserves the current complete-task payload shape", () => {
  const result = buildCompleteTaskPayload({
    taskId: "task-1",
    taskStartedAtMs: Date.parse("2026-05-23T08:00:00.000Z"),
    completedAtMs: Date.parse("2026-05-23T08:00:07.250Z"),
  });

  assert.deepEqual(result, {
    taskId: "task-1",
    secondsSpent: 7,
    startedAt: "2026-05-23T08:00:00.000Z",
    completedAt: "2026-05-23T08:00:07.250Z",
  });
});

test("buildCompleteTaskPayload preserves the minimum one-second behavior", () => {
  const result = buildCompleteTaskPayload({
    taskId: "task-1",
    taskStartedAtMs: Date.parse("2026-05-23T08:00:00.000Z"),
    completedAtMs: Date.parse("2026-05-23T08:00:00.200Z"),
  });

  assert.equal(result.secondsSpent, 1);
});

test("buildCompleteTaskPayload can preserve separate elapsed and completed timestamps", () => {
  const result = buildCompleteTaskPayload({
    taskId: "task-1",
    taskStartedAtMs: Date.parse("2026-05-23T08:00:00.000Z"),
    completedAtMs: Date.parse("2026-05-23T08:00:07.000Z"),
    elapsedNowMs: Date.parse("2026-05-23T08:00:08.000Z"),
  });

  assert.equal(result.secondsSpent, 8);
  assert.equal(result.completedAt, "2026-05-23T08:00:07.000Z");
});

test("shouldFinishAfterTask returns false before the last task", () => {
  assert.equal(
    shouldFinishAfterTask({
      completedTaskTimingCount: 1,
      routineTaskCount: 2,
    }),
    false,
  );
});

test("shouldFinishAfterTask returns true for the last task and preserves over-complete behavior", () => {
  assert.equal(
    shouldFinishAfterTask({
      completedTaskTimingCount: 2,
      routineTaskCount: 2,
    }),
    true,
  );
  assert.equal(
    shouldFinishAfterTask({
      completedTaskTimingCount: 3,
      routineTaskCount: 2,
    }),
    true,
  );
});

test("getSessionControlSuccessMessage preserves current status copy", () => {
  assert.equal(
    getSessionControlSuccessMessage("started"),
    "A torna elindult. Mehet az elso feladat.",
  );
  assert.equal(
    getSessionControlSuccessMessage("task-completed"),
    "Szuper! Mehet a kovetkezo feladat.",
  );
  assert.equal(
    getSessionControlSuccessMessage("session-finished"),
    "Ugyes voltal! A torna sikeresen befejezodott.",
  );
});

test("getSessionControlErrorMessage preserves Error message and fallback behavior", () => {
  assert.equal(getSessionControlErrorMessage(new Error("API hiba"), "Fallback"), "API hiba");
  assert.equal(getSessionControlErrorMessage("plain failure", "Fallback"), "Fallback");
});
