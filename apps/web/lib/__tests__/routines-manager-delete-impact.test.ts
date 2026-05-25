import assert from "node:assert/strict";
import test from "node:test";
import {
  applyPeriodPreviewSuccess,
  applyRoutinePreviewSuccess,
  applyTaskPreviewSuccess,
  clearAllDeleteImpactPreviews,
  clearPeriodPreview,
  clearRoutinePreview,
  clearTaskPreview,
  createEmptyDeleteImpactPreviewState,
  isPeriodPreviewFor,
  isRoutinePreviewFor,
  isTaskPreviewFor,
  type DeleteImpactPreview,
  type RoutineDeleteImpactPreviewState,
} from "../routines-manager-delete-impact";

type TestPreview = DeleteImpactPreview & {
  entityType: "routine" | "period" | "task";
  entityLabel: string;
};

function preview(entityType: TestPreview["entityType"], entityId: string): TestPreview {
  return {
    entityType,
    entityId,
    entityLabel: `${entityType}:${entityId}`,
  };
}

function populatedState(): RoutineDeleteImpactPreviewState<TestPreview> {
  return {
    routine: preview("routine", "routine-1"),
    period: preview("period", "period-1"),
    task: preview("task", "task-1"),
  };
}

test("createEmptyDeleteImpactPreviewState has no routine, period, or task preview", () => {
  assert.deepEqual(createEmptyDeleteImpactPreviewState<TestPreview>(), {
    routine: null,
    period: null,
    task: null,
  });
});

test("applyRoutinePreviewSuccess sets routine preview and clears period and task previews", () => {
  const result = applyRoutinePreviewSuccess(preview("routine", "routine-2"));

  assert.deepEqual(result, {
    routine: preview("routine", "routine-2"),
    period: null,
    task: null,
  });
});

test("applyPeriodPreviewSuccess preserves current competing behavior by keeping routine preview", () => {
  const result = applyPeriodPreviewSuccess(populatedState(), preview("period", "period-2"));

  assert.deepEqual(result, {
    routine: preview("routine", "routine-1"),
    period: preview("period", "period-2"),
    task: null,
  });
});

test("applyTaskPreviewSuccess preserves current competing behavior by keeping routine preview", () => {
  const result = applyTaskPreviewSuccess(populatedState(), preview("task", "task-2"));

  assert.deepEqual(result, {
    routine: preview("routine", "routine-1"),
    period: null,
    task: preview("task", "task-2"),
  });
});

test("clearRoutinePreview clears only the routine preview", () => {
  assert.deepEqual(clearRoutinePreview(populatedState()), {
    routine: null,
    period: preview("period", "period-1"),
    task: preview("task", "task-1"),
  });
});

test("clearPeriodPreview clears only the period preview", () => {
  assert.deepEqual(clearPeriodPreview(populatedState()), {
    routine: preview("routine", "routine-1"),
    period: null,
    task: preview("task", "task-1"),
  });
});

test("clearTaskPreview clears only the task preview", () => {
  assert.deepEqual(clearTaskPreview(populatedState()), {
    routine: preview("routine", "routine-1"),
    period: preview("period", "period-1"),
    task: null,
  });
});

test("clearAllDeleteImpactPreviews models opening an editor by clearing all previews", () => {
  assert.deepEqual(clearAllDeleteImpactPreviews<TestPreview>(), {
    routine: null,
    period: null,
    task: null,
  });
});

test("isRoutinePreviewFor matches and rejects routine targets by entityId", () => {
  const state = populatedState();

  assert.equal(isRoutinePreviewFor(state, "routine-1"), true);
  assert.equal(isRoutinePreviewFor(state, "routine-2"), false);
});

test("isPeriodPreviewFor matches and rejects period targets by entityId", () => {
  const state = populatedState();

  assert.equal(isPeriodPreviewFor(state, "period-1"), true);
  assert.equal(isPeriodPreviewFor(state, "period-2"), false);
});

test("isTaskPreviewFor matches and rejects task targets by entityId", () => {
  const state = populatedState();

  assert.equal(isTaskPreviewFor(state, "task-1"), true);
  assert.equal(isTaskPreviewFor(state, "task-2"), false);
});

test("target matching returns false when the relevant preview slot is empty", () => {
  const state = createEmptyDeleteImpactPreviewState<TestPreview>();

  assert.equal(isRoutinePreviewFor(state, "routine-1"), false);
  assert.equal(isPeriodPreviewFor(state, "period-1"), false);
  assert.equal(isTaskPreviewFor(state, "task-1"), false);
});
