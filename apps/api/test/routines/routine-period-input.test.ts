import assert from "node:assert/strict";
import test from "node:test";
import { buildRoutinePeriodInputData } from "../../src/routines/domain/routine-period-input";

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
