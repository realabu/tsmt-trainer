import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBadgeEvaluationFacts,
  type BadgeEvaluationFacts,
} from "../../src/sessions/domain/badge-evaluation-facts";

test("maps all counts unchanged", () => {
  const result = buildBadgeEvaluationFacts({
    completedSessionsCount: 5,
    completedRoutineSessionsCount: 3,
    distinctCompletedRoutineCount: 2,
    completedTaskCount: 11,
    previousBestTotalSeconds: 120,
    routine: null,
  });

  assert.equal(result.completedSessionsCount, 5);
  assert.equal(result.completedRoutineSessionsCount, 3);
  assert.equal(result.distinctCompletedRoutineCount, 2);
  assert.equal(result.completedTaskCount, 11);
});

test("maps previousBestTotalSeconds unchanged", () => {
  const result = buildBadgeEvaluationFacts({
    completedSessionsCount: 0,
    completedRoutineSessionsCount: 0,
    distinctCompletedRoutineCount: 0,
    completedTaskCount: 0,
    previousBestTotalSeconds: null,
    routine: null,
  });

  assert.equal(result.previousBestTotalSeconds, null);
});

test("preserves null routine", () => {
  const result = buildBadgeEvaluationFacts({
    completedSessionsCount: 1,
    completedRoutineSessionsCount: 1,
    distinctCompletedRoutineCount: 1,
    completedTaskCount: 1,
    previousBestTotalSeconds: undefined,
    routine: null,
  });

  assert.equal(result.routine, null);
});

test("preserves routine periods", () => {
  const routine: BadgeEvaluationFacts["routine"] = {
    id: "routine-1",
    periods: [
      {
        id: "period-1",
        startsOn: new Date("2026-04-01T00:00:00.000Z"),
        endsOn: new Date("2026-04-21T23:59:59.999Z"),
        weeklyTargetCount: 3,
      },
    ],
  };

  const result = buildBadgeEvaluationFacts({
    completedSessionsCount: 2,
    completedRoutineSessionsCount: 2,
    distinctCompletedRoutineCount: 1,
    completedTaskCount: 6,
    previousBestTotalSeconds: 95,
    routine,
  });

  assert.deepEqual(result.routine, routine);
});
