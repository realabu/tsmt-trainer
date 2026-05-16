import assert from "node:assert/strict";
import test from "node:test";
import { buildRoutineTaskCatalogSearchWhere } from "../../src/routines/domain/routine-task-catalog-search";

function createSearchWhereExpectation(query: string) {
  return {
    isActive: true,
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { summary: { contains: query, mode: "insensitive" } },
      { instructions: { contains: query, mode: "insensitive" } },
      { focusPoints: { contains: query, mode: "insensitive" } },
      { demoVideoUrl: { contains: query, mode: "insensitive" } },
      {
        defaultSong: {
          is: {
            title: { contains: query, mode: "insensitive" },
          },
        },
      },
      {
        equipmentLinks: {
          some: {
            equipmentCatalogItem: {
              name: { contains: query, mode: "insensitive" },
            },
          },
        },
      },
      {
        difficultyLevels: {
          some: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  };
}

test("task catalog search where returns active filter for undefined query", () => {
  assert.deepEqual(buildRoutineTaskCatalogSearchWhere(), { isActive: true });
});

test("task catalog search where trims whitespace-only query to active filter", () => {
  assert.deepEqual(buildRoutineTaskCatalogSearchWhere("   "), { isActive: true });
});

test("task catalog search where trims non-empty query and searches all current fields", () => {
  assert.deepEqual(
    buildRoutineTaskCatalogSearchWhere("  labda  "),
    createSearchWhereExpectation("labda"),
  );
});
