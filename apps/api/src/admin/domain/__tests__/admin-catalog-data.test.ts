import assert from "node:assert/strict";
import test from "node:test";
import { MediaKind } from "@prisma/client";
import {
  buildEquipmentIconMediaCreateRelation,
  buildEquipmentIconMediaUpdateRelation,
  buildSongAudioMediaCreateRelation,
  buildSongAudioMediaUpdateRelation,
  buildSongVideoMediaCreateRelation,
  buildSongVideoMediaUpdateRelation,
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

test("song create relations return undefined for undefined/null/empty and create for truthy values", () => {
  assert.equal(buildSongAudioMediaCreateRelation(undefined), undefined);
  assert.equal(buildSongAudioMediaCreateRelation(null), undefined);
  assert.equal(buildSongAudioMediaCreateRelation(""), undefined);
  assert.deepEqual(buildSongAudioMediaCreateRelation("https://example.com/audio.mp3"), {
    create: {
      kind: MediaKind.AUDIO,
      externalUrl: "https://example.com/audio.mp3",
    },
  });
  assert.equal(buildSongVideoMediaCreateRelation(undefined), undefined);
  assert.equal(buildSongVideoMediaCreateRelation(null), undefined);
  assert.equal(buildSongVideoMediaCreateRelation(""), undefined);
  assert.deepEqual(buildSongVideoMediaCreateRelation("https://example.com/video.mp4"), {
    create: {
      kind: MediaKind.VIDEO,
      externalUrl: "https://example.com/video.mp4",
    },
  });
});

test("song update relations return undefined/create/disconnect correctly", () => {
  assert.equal(buildSongAudioMediaUpdateRelation(undefined), undefined);
  assert.deepEqual(buildSongAudioMediaUpdateRelation("https://example.com/audio.mp3"), {
    create: {
      kind: MediaKind.AUDIO,
      externalUrl: "https://example.com/audio.mp3",
    },
  });
  assert.deepEqual(buildSongAudioMediaUpdateRelation(null), { disconnect: true });
  assert.deepEqual(buildSongAudioMediaUpdateRelation(""), { disconnect: true });
  assert.equal(buildSongVideoMediaUpdateRelation(undefined), undefined);
  assert.deepEqual(buildSongVideoMediaUpdateRelation("https://example.com/video.mp4"), {
    create: {
      kind: MediaKind.VIDEO,
      externalUrl: "https://example.com/video.mp4",
    },
  });
  assert.deepEqual(buildSongVideoMediaUpdateRelation(null), { disconnect: true });
  assert.deepEqual(buildSongVideoMediaUpdateRelation(""), { disconnect: true });
});

test("equipment icon create relation returns undefined for undefined/null/empty and create for truthy values", () => {
  assert.equal(buildEquipmentIconMediaCreateRelation(undefined), undefined);
  assert.equal(buildEquipmentIconMediaCreateRelation(null), undefined);
  assert.equal(buildEquipmentIconMediaCreateRelation(""), undefined);
  assert.deepEqual(buildEquipmentIconMediaCreateRelation("https://example.com/icon.png"), {
    create: {
      kind: MediaKind.IMAGE,
      externalUrl: "https://example.com/icon.png",
    },
  });
});

test("equipment icon update relation returns undefined/create/disconnect correctly", () => {
  assert.equal(buildEquipmentIconMediaUpdateRelation(undefined), undefined);
  assert.deepEqual(buildEquipmentIconMediaUpdateRelation("https://example.com/icon.png"), {
    create: {
      kind: MediaKind.IMAGE,
      externalUrl: "https://example.com/icon.png",
    },
  });
  assert.deepEqual(buildEquipmentIconMediaUpdateRelation(null), { disconnect: true });
  assert.deepEqual(buildEquipmentIconMediaUpdateRelation(""), { disconnect: true });
});
