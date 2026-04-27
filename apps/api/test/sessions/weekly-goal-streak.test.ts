import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWeeklyGoalSummaries,
  getConsecutiveWeeklyGoalStreakFromSummaries,
} from "../../src/sessions/domain/weekly-goal-streak";

test("returns streak 0 when no weekly target is met", () => {
  const completedAt = new Date(2026, 3, 12, 12, 0, 0, 0);
  const summaries = buildWeeklyGoalSummaries({
    periods: [
      {
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
        weeklyTargetCount: 2,
      },
    ],
    completedSessionDates: [],
    completedAt,
  });

  assert.equal(getConsecutiveWeeklyGoalStreakFromSummaries(summaries, completedAt), 0);
});

test("returns streak 1 for one completed target week", () => {
  const completedAt = new Date(2026, 3, 12, 12, 0, 0, 0);
  const summaries = buildWeeklyGoalSummaries({
    periods: [
      {
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
        weeklyTargetCount: 1,
      },
    ],
    completedSessionDates: [new Date(2026, 3, 8, 10, 0, 0, 0)],
    completedAt,
  });

  assert.equal(getConsecutiveWeeklyGoalStreakFromSummaries(summaries, completedAt), 1);
});

test("counts consecutive completed weeks", () => {
  const completedAt = new Date(2026, 3, 19, 12, 0, 0, 0);
  const summaries = buildWeeklyGoalSummaries({
    periods: [
      {
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 19, 23, 59, 59, 999),
        weeklyTargetCount: 1,
      },
    ],
    completedSessionDates: [
      new Date(2026, 3, 8, 10, 0, 0, 0),
      new Date(2026, 3, 16, 10, 0, 0, 0),
    ],
    completedAt,
  });

  assert.equal(getConsecutiveWeeklyGoalStreakFromSummaries(summaries, completedAt), 2);
});

test("builds weekly summaries across multiple periods in chronological week order", () => {
  const completedAt = new Date(2026, 3, 20, 12, 0, 0, 0);
  const summaries = buildWeeklyGoalSummaries({
    periods: [
      {
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
        weeklyTargetCount: 1,
      },
      {
        startsOn: new Date(2026, 3, 13, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 19, 23, 59, 59, 999),
        weeklyTargetCount: 1,
      },
    ],
    completedSessionDates: [
      new Date(2026, 3, 8, 10, 0, 0, 0),
      new Date(2026, 3, 14, 10, 0, 0, 0),
    ],
    completedAt,
  });

  assert.equal(summaries.length, 2);
  assert.deepEqual(
    summaries.map((summary) => summary.weekStart.toISOString()),
    [
      new Date(2026, 3, 6, 0, 0, 0, 0).toISOString(),
      new Date(2026, 3, 13, 0, 0, 0, 0).toISOString(),
    ],
  );
  assert.deepEqual(
    summaries.map((summary) => summary.targetMet),
    [true, true],
  );
});

test("streak stops at the first unmet week", () => {
  const completedAt = new Date(2026, 3, 26, 12, 0, 0, 0);
  const summaries = buildWeeklyGoalSummaries({
    periods: [
      {
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 26, 23, 59, 59, 999),
        weeklyTargetCount: 1,
      },
    ],
    completedSessionDates: [
      new Date(2026, 3, 8, 10, 0, 0, 0),
      new Date(2026, 3, 22, 10, 0, 0, 0),
    ],
    completedAt,
  });

  assert.equal(getConsecutiveWeeklyGoalStreakFromSummaries(summaries, completedAt), 1);
});

test("partial first and last weeks preserve current prorating behavior", () => {
  const completedAt = new Date(2026, 3, 17, 18, 0, 0, 0);
  const summaries = buildWeeklyGoalSummaries({
    periods: [
      {
        startsOn: new Date(2026, 3, 8, 10, 0, 0, 0),
        endsOn: new Date(2026, 3, 17, 18, 0, 0, 0),
        weeklyTargetCount: 3,
      },
    ],
    completedSessionDates: [
      new Date(2026, 3, 8, 12, 0, 0, 0),
      new Date(2026, 3, 9, 12, 0, 0, 0),
      new Date(2026, 3, 14, 12, 0, 0, 0),
      new Date(2026, 3, 16, 12, 0, 0, 0),
      new Date(2026, 3, 17, 12, 0, 0, 0),
    ],
    completedAt,
  });

  assert.deepEqual(
    summaries.map((summary) => summary.targetMet),
    [true, true],
  );
  assert.equal(getConsecutiveWeeklyGoalStreakFromSummaries(summaries, completedAt), 2);
});

test("completedAt cutoff excludes later weeks and sessions", () => {
  const completedAt = new Date(2026, 3, 15, 12, 0, 0, 0);
  const summaries = buildWeeklyGoalSummaries({
    periods: [
      {
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 19, 23, 59, 59, 999),
        weeklyTargetCount: 1,
      },
    ],
    completedSessionDates: [
      new Date(2026, 3, 8, 10, 0, 0, 0),
      new Date(2026, 3, 16, 10, 0, 0, 0),
    ],
    completedAt,
  });

  assert.equal(summaries.length, 2);
  assert.equal(summaries[0]?.targetMet, true);
  assert.equal(summaries[1]?.targetMet, false);
  assert.equal(getConsecutiveWeeklyGoalStreakFromSummaries(summaries, completedAt), 0);
});

test("buildWeeklyGoalSummaries ignores future weeks after completedAt", () => {
  const completedAt = new Date(2026, 3, 15, 12, 0, 0, 0);
  const summaries = buildWeeklyGoalSummaries({
    periods: [
      {
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 26, 23, 59, 59, 999),
        weeklyTargetCount: 1,
      },
    ],
    completedSessionDates: [
      new Date(2026, 3, 8, 10, 0, 0, 0),
      new Date(2026, 3, 16, 10, 0, 0, 0),
      new Date(2026, 3, 23, 10, 0, 0, 0),
    ],
    completedAt,
  });

  assert.deepEqual(
    summaries.map((summary) => summary.weekStart.toISOString()),
    [
      new Date(2026, 3, 6, 0, 0, 0, 0).toISOString(),
      new Date(2026, 3, 13, 0, 0, 0, 0).toISOString(),
    ],
  );
});

test("streak preserves current completedAt behavior when latest considered week is unmet", () => {
  const completedAt = new Date(2026, 3, 15, 12, 0, 0, 0);
  const summaries = buildWeeklyGoalSummaries({
    periods: [
      {
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 19, 23, 59, 59, 999),
        weeklyTargetCount: 1,
      },
    ],
    completedSessionDates: [new Date(2026, 3, 8, 10, 0, 0, 0)],
    completedAt,
  });

  assert.equal(getConsecutiveWeeklyGoalStreakFromSummaries(summaries, completedAt), 0);
});
