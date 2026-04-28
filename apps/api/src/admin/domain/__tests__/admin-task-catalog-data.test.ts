import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTaskCatalogCreateData,
  buildTaskCatalogUpdateScalarData,
} from "../admin-task-catalog-data";

test("create data defaults isActive to true, preserves scalar fields, and omits undefined optionals", () => {
  const result = buildTaskCatalogCreateData({
    title: "Labda",
    summary: "osszegzes",
    instructions: "utasitas",
    focusPoints: "fokusz",
    demoVideoUrl: "https://example.com/demo.mp4",
    defaultSongId: "song-1",
  });

  assert.deepEqual(result, {
    title: "Labda",
    summary: "osszegzes",
    instructions: "utasitas",
    focusPoints: "fokusz",
    demoVideoUrl: "https://example.com/demo.mp4",
    defaultSongId: "song-1",
    isActive: true,
  });
});

test("create data preserves explicit isActive false", () => {
  const result = buildTaskCatalogCreateData({
    title: "Labda",
    isActive: false,
  });

  assert.deepEqual(result, {
    title: "Labda",
    isActive: false,
  });
  assert.equal("summary" in result, false);
  assert.equal("instructions" in result, false);
  assert.equal("focusPoints" in result, false);
  assert.equal("demoVideoUrl" in result, false);
  assert.equal("defaultSongId" in result, false);
});

test("create defaultSongId preserves explicit values and omits undefined", () => {
  assert.deepEqual(buildTaskCatalogCreateData({ title: "Labda" }), {
    title: "Labda",
    isActive: true,
  });
  assert.deepEqual(
    buildTaskCatalogCreateData({ title: "Labda", defaultSongId: "song-3" }),
    {
      title: "Labda",
      defaultSongId: "song-3",
      isActive: true,
    },
  );
});

test("update defaultSongId preserves undefined, maps empty string to null, and keeps valid ids", () => {
  assert.deepEqual(buildTaskCatalogUpdateScalarData({ defaultSongId: undefined }), {});
  assert.deepEqual(buildTaskCatalogUpdateScalarData({ defaultSongId: "" }), {
    defaultSongId: null,
  });
  assert.deepEqual(buildTaskCatalogUpdateScalarData({ defaultSongId: "song-2" }), {
    defaultSongId: "song-2",
  });
});

test("update does not include undefined fields unnecessarily", () => {
  const result = buildTaskCatalogUpdateScalarData({
    title: "Frissitett",
    summary: undefined,
    instructions: undefined,
    focusPoints: "uj fokusz",
    demoVideoUrl: undefined,
    defaultSongId: undefined,
    isActive: false,
  });

  assert.deepEqual(result, {
    title: "Frissitett",
    focusPoints: "uj fokusz",
    isActive: false,
  });
  assert.equal("summary" in result, false);
  assert.equal("instructions" in result, false);
  assert.equal("demoVideoUrl" in result, false);
  assert.equal("defaultSongId" in result, false);
});
