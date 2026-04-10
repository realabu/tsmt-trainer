import assert from "node:assert/strict";
import test from "node:test";
import { buildBadgeAwardIdentifiers } from "../../src/sessions/domain/badge-award-identifiers";

test("builds weekly goal identifiers with routine, period, and week start", () => {
  const weekStart = new Date("2026-04-06T00:00:00.000Z");

  assert.deepEqual(
    buildBadgeAwardIdentifiers({
      type: "weekly-goal",
      routineId: "routine-1",
      periodId: "period-1",
      weekStart,
    }),
    {
      contextKey: "weekly-goal:routine-1:period-1:2026-04-06T00:00:00.000Z",
      reason: "weekly-goal-2026-04-06T00:00:00.000Z",
    },
  );
});

test("builds routine record identifiers from completion timestamp", () => {
  const completedAt = new Date("2026-04-10T07:15:12.000Z");

  assert.deepEqual(
    buildBadgeAwardIdentifiers({
      type: "routine-record",
      routineId: "routine-42",
      completedAt,
    }),
    {
      contextKey: "routine-record:routine-42:2026-04-10T07:15:12.000Z",
      reason: "routine-record-2026-04-10T07:15:12.000Z",
    },
  );
});

test("builds threshold-based identifiers deterministically", () => {
  assert.deepEqual(buildBadgeAwardIdentifiers({ type: "total-sessions", threshold: 10 }), {
    contextKey: "total-sessions-10",
    reason: "total-sessions-10",
  });

  assert.deepEqual(buildBadgeAwardIdentifiers({ type: "task-completions", threshold: 50 }), {
    contextKey: "task-completions:50",
    reason: "task-completions-50",
  });
});

test("builds first-session identifiers without date input", () => {
  assert.deepEqual(buildBadgeAwardIdentifiers({ type: "first-session" }), {
    contextKey: "first-session",
    reason: "first-session",
  });
});
