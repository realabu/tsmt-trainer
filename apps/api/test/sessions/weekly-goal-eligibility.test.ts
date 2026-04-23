import assert from "node:assert/strict";
import test from "node:test";
import {
  isPeriodTargetMet,
  isWeeklyGoalMet,
} from "../../src/sessions/domain/weekly-goal-eligibility";

test("weekly goal is met for a full week when completed sessions reach the weekly target", () => {
  const result = isWeeklyGoalMet({
    completedInWeek: 3,
    weekStart: new Date(2026, 3, 6, 0, 0, 0, 0),
    weekEnd: new Date(2026, 3, 12, 23, 59, 59, 999),
    period: {
      startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
      endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
      weeklyTargetCount: 3,
    },
  });

  assert.equal(result, true);
});

test("weekly goal is not met when completed sessions stay below the target", () => {
  const result = isWeeklyGoalMet({
    completedInWeek: 2,
    weekStart: new Date(2026, 3, 6, 0, 0, 0, 0),
    weekEnd: new Date(2026, 3, 12, 23, 59, 59, 999),
    period: {
      startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
      endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
      weeklyTargetCount: 3,
    },
  });

  assert.equal(result, false);
});

test("weekly goal preserves partial-week prorating behavior", () => {
  const result = isWeeklyGoalMet({
    completedInWeek: 2,
    weekStart: new Date(2026, 3, 6, 0, 0, 0, 0),
    weekEnd: new Date(2026, 3, 12, 23, 59, 59, 999),
    period: {
      startsOn: new Date(2026, 3, 8, 10, 0, 0, 0),
      endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
      weeklyTargetCount: 3,
    },
  });

  assert.equal(result, true);
});

test("period target is met when completed sessions reach the derived period target", () => {
  const result = isPeriodTargetMet({
    completedInPeriod: 6,
    period: {
      startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
      endsOn: new Date(2026, 3, 19, 23, 59, 59, 999),
      weeklyTargetCount: 3,
    },
  });

  assert.equal(result, true);
});

test("period target is not met when completed sessions stay below the derived period target", () => {
  const result = isPeriodTargetMet({
    completedInPeriod: 3,
    period: {
      startsOn: new Date(2026, 3, 8, 10, 0, 0, 0),
      endsOn: new Date(2026, 3, 17, 18, 0, 0, 0),
      weeklyTargetCount: 3,
    },
  });

  assert.equal(result, false);
});
