import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldAwardDistinctRoutineCountBadge,
  shouldAwardFirstSessionBadge,
  shouldAwardRoutineRecordBadge,
  shouldAwardRoutineSessionCountBadge,
  shouldAwardTaskCompletionCountBadge,
  shouldAwardTotalSessionCountBadge,
} from "../../src/sessions/domain/badge-trigger-decisions";

test("first session badge is awarded only at count 1", () => {
  assert.equal(shouldAwardFirstSessionBadge(0), false);
  assert.equal(shouldAwardFirstSessionBadge(1), true);
  assert.equal(shouldAwardFirstSessionBadge(2), false);
});

test("total session threshold preserves current threshold behavior", () => {
  assert.equal(shouldAwardTotalSessionCountBadge(5, 0), false);
  assert.equal(shouldAwardTotalSessionCountBadge(4, 5), false);
  assert.equal(shouldAwardTotalSessionCountBadge(5, 5), true);
  assert.equal(shouldAwardTotalSessionCountBadge(6, 5), true);
});

test("routine session threshold preserves current threshold behavior", () => {
  assert.equal(shouldAwardRoutineSessionCountBadge(5, 0), false);
  assert.equal(shouldAwardRoutineSessionCountBadge(4, 5), false);
  assert.equal(shouldAwardRoutineSessionCountBadge(5, 5), true);
  assert.equal(shouldAwardRoutineSessionCountBadge(6, 5), true);
});

test("distinct routine threshold preserves current threshold behavior", () => {
  assert.equal(shouldAwardDistinctRoutineCountBadge(3, 0), false);
  assert.equal(shouldAwardDistinctRoutineCountBadge(2, 3), false);
  assert.equal(shouldAwardDistinctRoutineCountBadge(3, 3), true);
  assert.equal(shouldAwardDistinctRoutineCountBadge(4, 3), true);
});

test("task completion threshold preserves current threshold behavior", () => {
  assert.equal(shouldAwardTaskCompletionCountBadge(10, 0), false);
  assert.equal(shouldAwardTaskCompletionCountBadge(9, 10), false);
  assert.equal(shouldAwardTaskCompletionCountBadge(10, 10), true);
  assert.equal(shouldAwardTaskCompletionCountBadge(11, 10), true);
});

test("routine record is awarded when there is no previous best", () => {
  assert.equal(shouldAwardRoutineRecordBadge(120, undefined), true);
  assert.equal(shouldAwardRoutineRecordBadge(120, null), true);
});

test("routine record is awarded only when faster than previous best", () => {
  assert.equal(shouldAwardRoutineRecordBadge(110, 120), true);
  assert.equal(shouldAwardRoutineRecordBadge(120, 120), false);
  assert.equal(shouldAwardRoutineRecordBadge(130, 120), false);
});
