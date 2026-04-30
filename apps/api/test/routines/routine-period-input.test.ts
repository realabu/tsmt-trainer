import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoutinePeriodCreateData,
  buildRoutinePeriodInputData,
  buildRoutinePeriodUpdateData,
} from "../../src/routines/domain/routine-period-input";

test("period mapping preserves date and count behavior", () => {
  const result = buildRoutinePeriodInputData({
    name: "Indulo szakasz",
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    weeklyTargetCount: 3,
  });

  assert.equal(result.name, "Indulo szakasz");
  assert.equal(result.startsOn.toISOString(), new Date("2026-04-01").toISOString());
  assert.equal(result.endsOn.toISOString(), new Date("2026-04-21").toISOString());
  assert.equal(result.weeklyTargetCount, 3);
});

test("period mapping preserves optional empty name behavior", () => {
  const result = buildRoutinePeriodInputData({
    name: "",
    startsOn: "2026-05-01",
    endsOn: "2026-05-07",
    weeklyTargetCount: 4,
  });

  assert.equal(result.name, "");
  assert.equal(result.weeklyTargetCount, 4);
});

test("period create data preserves routineId and existing period input mapping", () => {
  const result = buildRoutinePeriodCreateData("routine-1", {
    name: "Tavaszi blokk",
    startsOn: "2026-05-01",
    endsOn: "2026-05-21",
    weeklyTargetCount: 3,
  });

  assert.deepEqual(result, {
    routineId: "routine-1",
    name: "Tavaszi blokk",
    startsOn: new Date("2026-05-01T00:00:00.000Z"),
    endsOn: new Date("2026-05-21T00:00:00.000Z"),
    weeklyTargetCount: 3,
  });
});

test("period update data preserves existing period input mapping", () => {
  const result = buildRoutinePeriodUpdateData({
    name: "Frissitett blokk",
    startsOn: "2026-06-01",
    endsOn: "2026-06-28",
    weeklyTargetCount: 4,
  });

  assert.deepEqual(result, {
    name: "Frissitett blokk",
    startsOn: new Date("2026-06-01T00:00:00.000Z"),
    endsOn: new Date("2026-06-28T00:00:00.000Z"),
    weeklyTargetCount: 4,
  });
});
