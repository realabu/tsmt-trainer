import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRepetitionsLabel } from "../../src/routines/domain/repetition-label";

test("returns trimmed explicit repetition label when provided", () => {
  const result = normalizeRepetitionsLabel("  2x10  ", 3, 4);

  assert.equal(result, "2x10");
});

test("builds combined repetition label from repetition count and unit count", () => {
  const result = normalizeRepetitionsLabel(null, 2, 10);

  assert.equal(result, "2x10");
});

test("builds repetition label from repetition count only", () => {
  const result = normalizeRepetitionsLabel(null, 2, null);

  assert.equal(result, "2x");
});

test("builds repetition label from unit count only", () => {
  const result = normalizeRepetitionsLabel(undefined, null, 10);

  assert.equal(result, "10x");
});

test("returns null for missing or blank repetition inputs", () => {
  assert.equal(normalizeRepetitionsLabel(undefined, null, null), null);
  assert.equal(normalizeRepetitionsLabel("   ", null, null), null);
});
