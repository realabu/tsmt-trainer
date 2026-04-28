import assert from "node:assert/strict";
import test from "node:test";
import { MediaKind } from "@prisma/client";
import {
  buildEquipmentIconMediaRelation,
  buildSongAudioMediaRelation,
  buildSongVideoMediaRelation,
  buildTaskCatalogDifficultyLevelCreates,
  buildTaskCatalogEquipmentLinkCreates,
  buildTaskCatalogMediaLinkCreates,
} from "../admin-catalog-data";

test("task media link create data preserves label, kind, externalUrl, and sortOrder by index", () => {
  const result = buildTaskCatalogMediaLinkCreates([
    {
      kind: "IMAGE",
      label: "Borito",
      externalUrl: "https://example.com/image.png",
    },
    {
      kind: "VIDEO",
      label: undefined,
      externalUrl: "https://example.com/video.mp4",
    },
  ]);

  assert.deepEqual(result, [
    {
      label: "Borito",
      sortOrder: 0,
      mediaAsset: {
        create: {
          kind: MediaKind.IMAGE,
          externalUrl: "https://example.com/image.png",
        },
      },
    },
    {
      label: undefined,
      sortOrder: 1,
      mediaAsset: {
        create: {
          kind: MediaKind.VIDEO,
          externalUrl: "https://example.com/video.mp4",
        },
      },
    },
  ]);
});

test("equipment link create data maps ids exactly", () => {
  assert.deepEqual(buildTaskCatalogEquipmentLinkCreates(["eq-1", "eq-2"]), [
    { equipmentCatalogItemId: "eq-1" },
    { equipmentCatalogItemId: "eq-2" },
  ]);
});

test("difficulty level create data uses explicit sortOrder and index fallback", () => {
  const result = buildTaskCatalogDifficultyLevelCreates([
    { name: "Konnyu", description: "elso" },
    { name: "Halado", description: "masodik", sortOrder: 7 },
  ]);

  assert.deepEqual(result, [
    { name: "Konnyu", description: "elso", sortOrder: 0 },
    { name: "Halado", description: "masodik", sortOrder: 7 },
  ]);
});

test("song audio and video relation returns undefined, create, and disconnect correctly", () => {
  assert.equal(buildSongAudioMediaRelation(undefined), undefined);
  assert.deepEqual(buildSongAudioMediaRelation("https://example.com/audio.mp3"), {
    create: {
      kind: MediaKind.AUDIO,
      externalUrl: "https://example.com/audio.mp3",
    },
  });
  assert.deepEqual(buildSongAudioMediaRelation(null), { disconnect: true });
  assert.deepEqual(buildSongVideoMediaRelation(""), { disconnect: true });
  assert.deepEqual(buildSongVideoMediaRelation("https://example.com/video.mp4"), {
    create: {
      kind: MediaKind.VIDEO,
      externalUrl: "https://example.com/video.mp4",
    },
  });
});

test("equipment icon relation returns undefined, create, and disconnect correctly", () => {
  assert.equal(buildEquipmentIconMediaRelation(undefined), undefined);
  assert.deepEqual(buildEquipmentIconMediaRelation("https://example.com/icon.png"), {
    create: {
      kind: MediaKind.IMAGE,
      externalUrl: "https://example.com/icon.png",
    },
  });
  assert.deepEqual(buildEquipmentIconMediaRelation(null), { disconnect: true });
  assert.deepEqual(buildEquipmentIconMediaRelation(""), { disconnect: true });
});
