import assert from "node:assert/strict";
import test from "node:test";
import { resolveRoutineTaskSongId } from "../../src/routines/domain/routine-task-song";

test("falls back to catalog default when input songId is undefined", () => {
  const result = resolveRoutineTaskSongId(undefined, "song-1");

  assert.equal(result, "song-1");
});

test("preserves null when input songId is explicitly cleared", () => {
  const result = resolveRoutineTaskSongId(null, "song-1");

  assert.equal(result, null);
});

test("uses the provided song id directly", () => {
  const result = resolveRoutineTaskSongId("song-2", "song-1");

  assert.equal(result, "song-2");
});

test("preserves undefined when no input song id and no catalog default exist", () => {
  const result = resolveRoutineTaskSongId(undefined, undefined);

  assert.equal(result, undefined);
});

test("treats empty string like explicit clear and preserves null behavior", () => {
  const result = resolveRoutineTaskSongId("", "song-1");

  assert.equal(result, null);
});
