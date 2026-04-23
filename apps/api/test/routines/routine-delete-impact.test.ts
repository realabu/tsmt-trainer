import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoutineDeleteImpact,
  buildRoutinePeriodDeleteImpact,
  buildRoutineTaskDeleteImpact,
} from "../../src/routines/domain/routine-delete-impact";

test("builds routine delete impact including dependent sessions and detachments", () => {
  const result = buildRoutineDeleteImpact({
    routineId: "routine-1",
    routineName: "Esti feladatsor",
    childFirstName: "Anna",
    childLastName: "Teszt",
    taskCount: 4,
    taskMediaLinkCount: 2,
    periodCount: 3,
    sessionCount: 7,
    sessionTaskTimingCount: 21,
    trainerAssignmentCount: 1,
    detachedBadgeAwardCount: 5,
  });

  assert.equal(result.entityType, "routine");
  assert.equal(result.entityId, "routine-1");
  assert.equal(result.entityLabel, "Esti feladatsor");
  assert.equal(result.parentLabel, "Anna Teszt");
  assert.deepEqual(result.deletes, [
    { label: "Feladat", count: 4 },
    { label: "Feladat media kapcsolat", count: 2 },
    { label: "Idoszak", count: 3 },
    { label: "Torna", count: 7 },
    { label: "Reszido bejegyzes", count: 21 },
    { label: "Trainer megosztas", count: 1 },
  ]);
  assert.deepEqual(result.detaches, [
    { label: "Badge megszerzes kapcsolat", count: 5 },
  ]);
});

test("builds routine delete impact for an empty routine", () => {
  const result = buildRoutineDeleteImpact({
    routineId: "routine-2",
    routineName: "Ures feladatsor",
    childFirstName: "Bence",
    childLastName: "Minta",
    taskCount: 0,
    taskMediaLinkCount: 0,
    periodCount: 0,
    sessionCount: 0,
    sessionTaskTimingCount: 0,
    trainerAssignmentCount: 0,
    detachedBadgeAwardCount: 0,
  });

  assert.deepEqual(result.deletes, [
    { label: "Feladat", count: 0 },
    { label: "Feladat media kapcsolat", count: 0 },
    { label: "Idoszak", count: 0 },
    { label: "Torna", count: 0 },
    { label: "Reszido bejegyzes", count: 0 },
    { label: "Trainer megosztas", count: 0 },
  ]);
  assert.deepEqual(result.detaches, [
    { label: "Badge megszerzes kapcsolat", count: 0 },
  ]);
});

test("builds task delete impact with timing deletion note", () => {
  const result = buildRoutineTaskDeleteImpact({
    taskId: "task-1",
    taskTitle: "Labda feldobas",
    routineName: "Esti feladatsor",
    childFirstName: "Anna",
    childLastName: "Teszt",
    taskMediaLinkCount: 2,
    sessionTimingCount: 6,
  });

  assert.equal(result.entityType, "task");
  assert.equal(result.entityLabel, "Labda feldobas");
  assert.equal(result.parentLabel, "Anna Teszt / Esti feladatsor");
  assert.deepEqual(result.deletes, [
    { label: "Feladat media kapcsolat", count: 2 },
    { label: "Reszido bejegyzes", count: 6 },
  ]);
});

test("builds period delete impact including empty-period edge cases", () => {
  const result = buildRoutinePeriodDeleteImpact({
    periodId: "period-1",
    periodName: null,
    routineName: "Esti feladatsor",
    childFirstName: "Anna",
    childLastName: "Teszt",
    detachedBadgeAwardCount: 0,
    completedSessionCount: 0,
  });

  assert.equal(result.entityType, "period");
  assert.equal(result.entityLabel, "Nev nelkuli idoszak");
  assert.equal(result.parentLabel, "Anna Teszt / Esti feladatsor");
  assert.deepEqual(result.deletes, []);
  assert.deepEqual(result.detaches, [
    { label: "Idoszakhoz kotott badge kapcsolat", count: 0 },
  ]);
  assert.deepEqual(result.notes, [
    "0 befejezett torna marad meg, de a torolt idoszak tobbe nem fog megjelenni a haladasi nezetekben.",
  ]);
});
