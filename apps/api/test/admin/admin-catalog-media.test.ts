import assert from "node:assert/strict";
import test from "node:test";
import { MediaKind } from "@prisma/client";
import { buildAdminCatalogMediaCreate } from "../../src/admin/domain/admin-catalog-media";

test("builds IMAGE media create shape with correct sortOrder and externalUrl", () => {
  assert.deepEqual(
    buildAdminCatalogMediaCreate(
      { kind: "IMAGE", externalUrl: "https://example.com/image.png" },
      2,
    ),
    {
      sortOrder: 2,
      mediaAsset: {
        create: {
          kind: MediaKind.IMAGE,
          externalUrl: "https://example.com/image.png",
        },
      },
    },
  );
});

test("builds AUDIO media create shape", () => {
  assert.deepEqual(
    buildAdminCatalogMediaCreate({ kind: "AUDIO", externalUrl: "https://example.com/audio.mp3" }, 0),
    {
      sortOrder: 0,
      mediaAsset: {
        create: {
          kind: MediaKind.AUDIO,
          externalUrl: "https://example.com/audio.mp3",
        },
      },
    },
  );
});

test("builds VIDEO media create shape", () => {
  assert.deepEqual(
    buildAdminCatalogMediaCreate({ kind: "VIDEO", externalUrl: "https://example.com/video.mp4" }, 1),
    {
      sortOrder: 1,
      mediaAsset: {
        create: {
          kind: MediaKind.VIDEO,
          externalUrl: "https://example.com/video.mp4",
        },
      },
    },
  );
});

test("builds EXTERNAL_LINK media create shape", () => {
  assert.deepEqual(
    buildAdminCatalogMediaCreate(
      { kind: "EXTERNAL_LINK", externalUrl: "https://example.com/reference" },
      3,
    ),
    {
      sortOrder: 3,
      mediaAsset: {
        create: {
          kind: MediaKind.EXTERNAL_LINK,
          externalUrl: "https://example.com/reference",
        },
      },
    },
  );
});

test("passes externalUrl through unchanged when null", () => {
  assert.deepEqual(buildAdminCatalogMediaCreate({ kind: "IMAGE", externalUrl: null }, 4), {
    sortOrder: 4,
    mediaAsset: {
      create: {
        kind: MediaKind.IMAGE,
        externalUrl: null,
      },
    },
  });
});
