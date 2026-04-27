import assert from "node:assert/strict";
import test from "node:test";
import {
  endOfWeek,
  getInclusiveDayCount,
  getProRatedWeeklyTarget,
  getTotalTargetForPeriod,
  startOfWeek,
} from "../../src/sessions/domain/session-week-boundaries";

test("startOfWeek keeps Monday as Monday at midnight", () => {
  const result = startOfWeek(new Date(2026, 3, 6, 14, 23, 45, 123));

  assert.equal(result.getDay(), 1);
  assert.equal(result.getHours(), 0);
  assert.equal(result.getMinutes(), 0);
  assert.equal(result.getSeconds(), 0);
  assert.equal(result.getMilliseconds(), 0);
});

test("startOfWeek maps Sunday back to Monday of the same week", () => {
  const result = startOfWeek(new Date(2026, 3, 12, 9, 30, 0, 0));

  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 3);
  assert.equal(result.getDate(), 6);
  assert.equal(result.getDay(), 1);
  assert.equal(result.getHours(), 0);
  assert.equal(result.getMinutes(), 0);
  assert.equal(result.getSeconds(), 0);
  assert.equal(result.getMilliseconds(), 0);
});

test("startOfWeek preserves current Monday-based behavior for midweek dates", () => {
  const result = startOfWeek(new Date(2026, 3, 9, 18, 45, 0, 0));

  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 3);
  assert.equal(result.getDate(), 6);
  assert.equal(result.getDay(), 1);
});

test("endOfWeek returns Sunday 23:59:59.999 for the computed week", () => {
  const result = endOfWeek(new Date(2026, 3, 8, 10, 0, 0, 0));

  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 3);
  assert.equal(result.getDate(), 12);
  assert.equal(result.getDay(), 0);
  assert.equal(result.getHours(), 23);
  assert.equal(result.getMinutes(), 59);
  assert.equal(result.getSeconds(), 59);
  assert.equal(result.getMilliseconds(), 999);
});

test("endOfWeek preserves current Sunday-based behavior when input is already Sunday", () => {
  const result = endOfWeek(new Date(2026, 3, 12, 9, 0, 0, 0));

  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 3);
  assert.equal(result.getDate(), 12);
  assert.equal(result.getDay(), 0);
  assert.equal(result.getHours(), 23);
  assert.equal(result.getMinutes(), 59);
  assert.equal(result.getSeconds(), 59);
  assert.equal(result.getMilliseconds(), 999);
});

test("getInclusiveDayCount returns 1 for the same day regardless of time", () => {
  const result = getInclusiveDayCount(
    new Date(2026, 3, 8, 0, 1, 0, 0),
    new Date(2026, 3, 8, 23, 59, 0, 0),
  );

  assert.equal(result, 1);
});

test("getInclusiveDayCount returns inclusive multi-day count", () => {
  const result = getInclusiveDayCount(
    new Date(2026, 3, 6, 12, 0, 0, 0),
    new Date(2026, 3, 12, 8, 0, 0, 0),
  );

  assert.equal(result, 7);
});

test("getProRatedWeeklyTarget returns the original target for a full week", () => {
  const result = getProRatedWeeklyTarget(
    3,
    new Date(2026, 3, 6, 0, 0, 0, 0),
    new Date(2026, 3, 12, 23, 59, 59, 999),
  );

  assert.equal(result, 3);
});

test("getProRatedWeeklyTarget preserves current partial-week behavior", () => {
  const result = getProRatedWeeklyTarget(
    3,
    new Date(2026, 3, 6, 12, 0, 0, 0),
    new Date(2026, 3, 8, 8, 0, 0, 0),
  );

  assert.equal(result, 1);
});

test("getProRatedWeeklyTarget preserves rounding behavior for very small ranges", () => {
  const result = getProRatedWeeklyTarget(
    3,
    new Date(2026, 3, 6, 12, 0, 0, 0),
    new Date(2026, 3, 6, 12, 5, 0, 0),
  );

  assert.equal(result, 0);
});

test("getTotalTargetForPeriod returns the weekly target for a single full week period", () => {
  const result = getTotalTargetForPeriod({
    weeklyTargetCount: 3,
    startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
    endsOn: new Date(2026, 3, 12, 23, 59, 59, 999),
  });

  assert.equal(result, 3);
});

test("getTotalTargetForPeriod sums multiple full weeks", () => {
  const result = getTotalTargetForPeriod({
    weeklyTargetCount: 3,
    startsOn: new Date(2026, 3, 6, 0, 0, 0, 0),
    endsOn: new Date(2026, 3, 19, 23, 59, 59, 999),
  });

  assert.equal(result, 6);
});

test("getTotalTargetForPeriod preserves partial first and last week prorating", () => {
  const result = getTotalTargetForPeriod({
    weeklyTargetCount: 3,
    startsOn: new Date(2026, 3, 8, 10, 0, 0, 0),
    endsOn: new Date(2026, 3, 17, 18, 0, 0, 0),
  });

  assert.equal(result, 4);
});
