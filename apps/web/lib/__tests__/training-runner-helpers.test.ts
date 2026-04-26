import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRingStyle,
  formatDuration,
  initialsFromTitle,
} from "../training-runner-helpers";

test("formatDuration handles zero seconds", () => {
  assert.equal(formatDuration(0), "0:00");
});

test("formatDuration preserves current null-like behavior", () => {
  assert.equal(formatDuration(null as unknown as number), "0:00");
});

test("formatDuration handles large numbers", () => {
  assert.equal(formatDuration(3671), "61:11");
});

test("initialsFromTitle handles one word", () => {
  assert.equal(initialsFromTitle("Labda"), "L");
});

test("initialsFromTitle handles two words", () => {
  assert.equal(initialsFromTitle("labda dobas"), "LD");
});

test("initialsFromTitle handles empty input", () => {
  assert.equal(initialsFromTitle(""), "");
});

test("buildRingStyle handles 0 percent", () => {
  assert.deepEqual(buildRingStyle(0, 100, "#fff"), {
    background: "conic-gradient(#fff 0%, rgba(255,255,255,0.18) 0% 100%)",
  });
});

test("buildRingStyle handles 50 percent", () => {
  assert.deepEqual(buildRingStyle(50, 100, "#fff"), {
    background: "conic-gradient(#fff 50%, rgba(255,255,255,0.18) 50% 100%)",
  });
});

test("buildRingStyle handles 100 percent", () => {
  assert.deepEqual(buildRingStyle(100, 100, "#fff"), {
    background: "conic-gradient(#fff 100%, rgba(255,255,255,0.18) 100% 100%)",
  });
});
