import assert from "node:assert/strict";
import test from "node:test";
import { MediaKind } from "@prisma/client";
import { parseAdminCatalogMediaKind } from "../../src/admin/domain/admin-media-kind";

test("maps IMAGE to Prisma MediaKind.IMAGE", () => {
  assert.equal(parseAdminCatalogMediaKind("IMAGE"), MediaKind.IMAGE);
});

test("maps AUDIO to Prisma MediaKind.AUDIO", () => {
  assert.equal(parseAdminCatalogMediaKind("AUDIO"), MediaKind.AUDIO);
});

test("maps VIDEO to Prisma MediaKind.VIDEO", () => {
  assert.equal(parseAdminCatalogMediaKind("VIDEO"), MediaKind.VIDEO);
});

test("maps EXTERNAL_LINK to Prisma MediaKind.EXTERNAL_LINK", () => {
  assert.equal(parseAdminCatalogMediaKind("EXTERNAL_LINK"), MediaKind.EXTERNAL_LINK);
});
