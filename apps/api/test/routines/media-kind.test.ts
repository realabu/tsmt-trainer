import assert from "node:assert/strict";
import test from "node:test";
import { MediaKind } from "@prisma/client";
import { parseRoutineTaskMediaKind } from "../../src/routines/domain/media-kind";

test("maps IMAGE to Prisma MediaKind.IMAGE", () => {
  assert.equal(parseRoutineTaskMediaKind("IMAGE"), MediaKind.IMAGE);
});

test("maps AUDIO to Prisma MediaKind.AUDIO", () => {
  assert.equal(parseRoutineTaskMediaKind("AUDIO"), MediaKind.AUDIO);
});

test("maps VIDEO to Prisma MediaKind.VIDEO", () => {
  assert.equal(parseRoutineTaskMediaKind("VIDEO"), MediaKind.VIDEO);
});

test("maps EXTERNAL_LINK to Prisma MediaKind.EXTERNAL_LINK", () => {
  assert.equal(parseRoutineTaskMediaKind("EXTERNAL_LINK"), MediaKind.EXTERNAL_LINK);
});
