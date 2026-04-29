import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoutineCreateScalarData,
  buildRoutineUpdateScalarData,
} from "../../src/routines/domain/routine-scalar-data";

test("create scalar data preserves childId, name, and explicit description", () => {
  const result = buildRoutineCreateScalarData({
    childId: "child-1",
    name: "Reggeli torna",
    description: "Leiras",
  });

  assert.deepEqual(result, {
    childId: "child-1",
    name: "Reggeli torna",
    description: "Leiras",
  });
});

test("create scalar data preserves undefined description behavior", () => {
  const result = buildRoutineCreateScalarData({
    childId: "child-1",
    name: "Reggeli torna",
  });

  assert.deepEqual(result, {
    childId: "child-1",
    name: "Reggeli torna",
    description: undefined,
  });
});

test("update scalar data preserves provided name and description", () => {
  const result = buildRoutineUpdateScalarData({
    name: "Frissitett nev",
    description: "Frissitett leiras",
  });

  assert.deepEqual(result, {
    name: "Frissitett nev",
    description: "Frissitett leiras",
  });
});

test("update scalar data preserves undefined field behavior", () => {
  const result = buildRoutineUpdateScalarData({
    name: undefined,
    description: "Frissitett leiras",
  });

  assert.deepEqual(result, {
    name: undefined,
    description: "Frissitett leiras",
  });
});
