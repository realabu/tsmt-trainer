import assert from "node:assert/strict";
import test from "node:test";
import { buildRoutineTaskDisplayFields } from "../../src/routines/domain/routine-task-display";

test("explicit input title, details, and coachText win over catalog values", () => {
  const result = buildRoutineTaskDisplayFields(
    {
      title: "Sajat cim",
      details: "Sajat leiras",
      coachText: "Sajat coach text",
    },
    {
      title: "Katalogus cim",
      summary: "Katalogus leiras",
    },
  );

  assert.deepEqual(result, {
    title: "Sajat cim",
    details: "Sajat leiras",
    coachText: "Sajat coach text",
  });
});

test("catalog fallback is used when input values are nullish", () => {
  const result = buildRoutineTaskDisplayFields(
    {
      title: null,
      details: undefined,
      coachText: undefined,
    },
    {
      title: "Katalogus cim",
      summary: "Katalogus leiras",
    },
  );

  assert.deepEqual(result, {
    title: "Katalogus cim",
    details: "Katalogus leiras",
    coachText: null,
  });
});

test("returns null where current logic returns null", () => {
  const result = buildRoutineTaskDisplayFields(
    {
      title: null,
      details: null,
      coachText: null,
    },
    null,
  );

  assert.deepEqual(result, {
    title: undefined,
    details: null,
    coachText: null,
  });
});

test("preserves empty string behavior exactly", () => {
  const result = buildRoutineTaskDisplayFields(
    {
      title: "",
      details: "",
      coachText: "",
    },
    {
      title: "Katalogus cim",
      summary: "Katalogus leiras",
    },
  );

  assert.deepEqual(result, {
    title: "",
    details: "",
    coachText: "",
  });
});
