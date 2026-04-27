import assert from "node:assert/strict";
import test from "node:test";
import { buildParentDashboardViewModel } from "../parent-dashboard-view-model";

function child(id: string) {
  return { id, firstName: `Child${id}`, lastName: "Test" };
}

function session(id: string, childId: string, completedAt: string) {
  return {
    id,
    childId,
    routineId: "r1",
    completedAt,
    routine: {
      id: "r1",
      name: "Routine",
    },
  };
}

test("selects child routines and effective routine fallback correctly", () => {
  const result = buildParentDashboardViewModel({
    children: [child("child-1")],
    routines: [
      { id: "routine-1", childId: "child-1" },
      { id: "routine-2", childId: "child-1" },
      { id: "routine-3", childId: "child-2" },
    ],
    sessions: [],
    periods: [],
    selectedChildId: "child-1",
    selectedRoutineId: "routine-missing",
    selectedPeriodId: "",
    progressLoaded: false,
    loadedProgressRoutineId: "",
  });

  assert.deepEqual(result.childRoutines.map((item) => item.id), ["routine-1", "routine-2"]);
  assert.equal(result.effectiveRoutineId, "routine-1");
});

test("keeps selected routine when valid", () => {
  const result = buildParentDashboardViewModel({
    children: [child("child-1")],
    routines: [
      { id: "routine-1", childId: "child-1" },
      { id: "routine-2", childId: "child-1" },
    ],
    sessions: [],
    periods: [],
    selectedChildId: "child-1",
    selectedRoutineId: "routine-2",
    selectedPeriodId: "",
    progressLoaded: false,
    loadedProgressRoutineId: "",
  });

  assert.equal(result.effectiveRoutineId, "routine-2");
  assert.equal(result.selectedRoutine?.id, "routine-2");
});

test("selects latest sessions for selected child sorted descending and limited", () => {
  const result = buildParentDashboardViewModel({
    children: [child("child-1")],
    routines: [],
    sessions: [
      session("s1", "child-1", "2026-04-03T00:00:00.000Z"),
      session("s2", "child-1", "2026-04-05T00:00:00.000Z"),
      session("s3", "child-1", "2026-04-01T00:00:00.000Z"),
      session("s4", "child-1", "2026-04-06T00:00:00.000Z"),
      session("s5", "child-1", "2026-04-02T00:00:00.000Z"),
      session("s6", "child-1", "2026-04-04T00:00:00.000Z"),
      session("other", "child-2", "2026-04-07T00:00:00.000Z"),
    ],
    periods: [],
    selectedChildId: "child-1",
    selectedRoutineId: "",
    selectedPeriodId: "",
    progressLoaded: false,
    loadedProgressRoutineId: "",
  });

  assert.deepEqual(result.latestSessionsForChild.map((item) => item.id), ["s4", "s2", "s6", "s1", "s5"]);
});

test("derives active/current period progress metrics and progress squares", () => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 1);
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 1);
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - 3);
  const periodEnd = new Date(now);
  periodEnd.setDate(now.getDate() + 10);

  const result = buildParentDashboardViewModel({
    children: [child("child-1")],
    routines: [{ id: "routine-1", childId: "child-1" }],
    sessions: [],
    periods: [
      {
        id: "period-1",
        name: "Aktiv",
        startsOn: periodStart.toISOString(),
        endsOn: periodEnd.toISOString(),
        weeklyTargetCount: 3,
        totalCompletedSessions: 4,
        weeks: [
          {
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            targetSessions: 3,
            completedSessions: 2,
            targetMet: false,
          },
          {
            weekStart: periodEnd.toISOString(),
            weekEnd: periodEnd.toISOString(),
            targetSessions: 2,
            completedSessions: 2,
            targetMet: true,
          },
        ],
      },
    ],
    selectedChildId: "child-1",
    selectedRoutineId: "routine-1",
    selectedPeriodId: "",
    progressLoaded: true,
    loadedProgressRoutineId: "routine-1",
  });

  assert.equal(result.selectedPeriod?.id, "period-1");
  assert.equal(result.periodState, "Aktiv idoszak");
  assert.equal(result.currentWeek?.completedSessions, 2);
  assert.equal(result.remainingThisWeek, 1);
  assert.equal(result.totalTargetInPeriod, 5);
  assert.equal(result.remainingInPeriod, 1);
  assert.deepEqual(result.weeklySquares.map((item) => item.state), ["done", "done", "pending"]);
  assert.deepEqual(result.periodSquares.map((item) => item.state), ["done", "done", "done", "done", "pending"]);
});

test("handles no selected child/routine/period gracefully", () => {
  const result = buildParentDashboardViewModel({
    children: [],
    routines: [],
    sessions: [],
    periods: [],
    selectedChildId: "",
    selectedRoutineId: "",
    selectedPeriodId: "",
    progressLoaded: false,
    loadedProgressRoutineId: "",
  });

  assert.deepEqual(result.childRoutines, []);
  assert.equal(result.effectiveRoutineId, "");
  assert.equal(result.selectedChild, null);
  assert.equal(result.selectedRoutine, null);
  assert.equal(result.selectedPeriod, null);
  assert.equal(result.currentWeek, null);
  assert.equal(result.remainingThisWeek, 0);
  assert.equal(result.totalTargetInPeriod, 0);
  assert.equal(result.remainingInPeriod, 0);
  assert.deepEqual(result.weeklySquares, []);
  assert.deepEqual(result.periodSquares, []);
});

test("derives isSelectedRoutineProgressReady correctly", () => {
  const notReady = buildParentDashboardViewModel({
    children: [child("child-1")],
    routines: [{ id: "routine-1", childId: "child-1" }],
    sessions: [],
    periods: [],
    selectedChildId: "child-1",
    selectedRoutineId: "routine-1",
    selectedPeriodId: "",
    progressLoaded: false,
    loadedProgressRoutineId: "",
  });

  assert.equal(notReady.isSelectedRoutineProgressReady, false);

  const ready = buildParentDashboardViewModel({
    children: [child("child-1")],
    routines: [{ id: "routine-1", childId: "child-1" }],
    sessions: [],
    periods: [],
    selectedChildId: "child-1",
    selectedRoutineId: "routine-1",
    selectedPeriodId: "",
    progressLoaded: true,
    loadedProgressRoutineId: "routine-1",
  });

  assert.equal(ready.isSelectedRoutineProgressReady, true);
});
