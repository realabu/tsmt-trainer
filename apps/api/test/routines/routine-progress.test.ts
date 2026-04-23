import assert from "node:assert/strict";
import test from "node:test";
import { calculateRoutineProgressPeriods } from "../../src/routines/domain/routine-progress";

test("returns one period with zero completed sessions when nothing was completed", () => {
  const periods = calculateRoutineProgressPeriods({
    periods: [
      {
        id: "period-1",
        name: "Elso idoszak",
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
        weeklyTargetCount: 3,
      },
    ],
    sessions: [],
  });

  assert.equal(periods.length, 1);
  assert.equal(periods[0]?.totalCompletedSessions, 0);
  assert.equal(periods[0]?.weeks.length, 1);
  assert.equal(periods[0]?.weeks[0]?.completedSessions, 0);
  assert.equal(periods[0]?.weeks[0]?.targetSessions, 3);
  assert.equal(periods[0]?.weeks[0]?.targetMet, false);
});

test("marks a single full-week period as met when completed sessions reach target", () => {
  const periods = calculateRoutineProgressPeriods({
    periods: [
      {
        id: "period-1",
        name: "Elso idoszak",
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
        weeklyTargetCount: 3,
      },
    ],
    sessions: [
      { completedAt: new Date(2026, 3, 6, 10, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 8, 10, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 10, 10, 0, 0, 0) },
    ],
  });

  assert.equal(periods[0]?.totalCompletedSessions, 3);
  assert.equal(periods[0]?.weeks[0]?.targetSessions, 3);
  assert.equal(periods[0]?.weeks[0]?.completedSessions, 3);
  assert.equal(periods[0]?.weeks[0]?.targetMet, true);
});

test("builds multi-week summaries for a longer period", () => {
  const periods = calculateRoutineProgressPeriods({
    periods: [
      {
        id: "period-1",
        name: "Ket het",
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 19, 23, 59, 59, 999),
        weeklyTargetCount: 3,
      },
    ],
    sessions: [
      { completedAt: new Date(2026, 3, 7, 10, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 15, 10, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 16, 10, 0, 0, 0) },
    ],
  });

  assert.equal(periods[0]?.weeks.length, 2);
  assert.equal(periods[0]?.weeks[0]?.targetSessions, 3);
  assert.equal(periods[0]?.weeks[0]?.completedSessions, 1);
  assert.equal(periods[0]?.weeks[1]?.targetSessions, 3);
  assert.equal(periods[0]?.weeks[1]?.completedSessions, 2);
});

test("preserves partial first and last week behavior", () => {
  const periods = calculateRoutineProgressPeriods({
    periods: [
      {
        id: "period-1",
        name: "Tort hetes idoszak",
        startsOn: new Date(2026, 3, 8, 10, 0, 0, 0),
        endsOn: new Date(2026, 3, 17, 18, 0, 0, 0),
        weeklyTargetCount: 3,
      },
    ],
    sessions: [
      { completedAt: new Date(2026, 3, 8, 12, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 9, 12, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 14, 12, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 16, 12, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 17, 12, 0, 0, 0) },
    ],
  });

  assert.equal(periods[0]?.weeks.length, 2);
  assert.equal(periods[0]?.weeks[0]?.targetSessions, 2);
  assert.equal(periods[0]?.weeks[0]?.completedSessions, 2);
  assert.equal(periods[0]?.weeks[0]?.targetMet, true);
  assert.equal(periods[0]?.weeks[1]?.targetSessions, 2);
  assert.equal(periods[0]?.weeks[1]?.completedSessions, 3);
  assert.equal(periods[0]?.weeks[1]?.targetMet, true);
});

test("ignores completed sessions outside the period boundaries", () => {
  const periods = calculateRoutineProgressPeriods({
    periods: [
      {
        id: "period-1",
        name: "Elso idoszak",
        startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
        endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
        weeklyTargetCount: 3,
      },
    ],
    sessions: [
      { completedAt: new Date(2026, 3, 5, 12, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 8, 12, 0, 0, 0) },
      { completedAt: new Date(2026, 3, 13, 12, 0, 0, 0) },
    ],
  });

  assert.equal(periods[0]?.totalCompletedSessions, 1);
  assert.equal(periods[0]?.weeks[0]?.completedSessions, 1);
});
