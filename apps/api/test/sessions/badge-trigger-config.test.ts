import assert from "node:assert/strict";
import test from "node:test";
import { getBadgeTriggerThreshold } from "../../src/sessions/domain/badge-trigger-config";

test("returns 0 for null config", () => {
  assert.equal(getBadgeTriggerThreshold(null), 0);
});

test("returns 0 for empty config object", () => {
  assert.equal(getBadgeTriggerThreshold({}), 0);
});

test("returns numeric threshold as-is", () => {
  assert.equal(getBadgeTriggerThreshold({ threshold: 7 }), 7);
});

test("preserves Number behavior for string numeric threshold", () => {
  assert.equal(getBadgeTriggerThreshold({ threshold: "12" as unknown as number }), 12);
});

test("preserves Number behavior for invalid threshold", () => {
  assert.equal(Number.isNaN(getBadgeTriggerThreshold({ threshold: "abc" as unknown as number })), true);
});

test("returns 0 for zero threshold", () => {
  assert.equal(getBadgeTriggerThreshold({ threshold: 0 }), 0);
});
