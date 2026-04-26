import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProgressSquares,
  formatDuration,
  getInitials,
  getPeriodState,
  getSessionSortValue,
  pickCurrentWeek,
  pickRelevantPeriod,
  sumTargetSessions,
} from "../parent-dashboard-helpers";

function withMockedDate<T>(isoDate: string, run: () => T) {
  const RealDate = Date;

  class MockDate extends RealDate {
    constructor(value?: string | number | Date) {
      super(value ?? isoDate);
    }

    static override now() {
      return new RealDate(isoDate).getTime();
    }
  }

  // @ts-expect-error test-only Date override
  globalThis.Date = MockDate;
  try {
    return run();
  } finally {
    globalThis.Date = RealDate;
  }
}

test("session sort value prefers completedAt over createdAt", () => {
  const result = getSessionSortValue({
    completedAt: "2026-04-20T10:00:00.000Z",
    createdAt: "2026-04-19T10:00:00.000Z",
  });

  assert.equal(result, new Date("2026-04-20T10:00:00.000Z").getTime());
});

test("session sort value falls back to createdAt then 0", () => {
  assert.equal(
    getSessionSortValue({
      completedAt: null,
      createdAt: "2026-04-19T10:00:00.000Z",
    }),
    new Date("2026-04-19T10:00:00.000Z").getTime(),
  );
  assert.equal(getSessionSortValue({ completedAt: null }), 0);
});

test("period state handles no period, active, future, and closed", () => {
  withMockedDate("2026-04-20T12:00:00.000Z", () => {
    assert.equal(getPeriodState(null), "Nincs idoszak");
    assert.equal(
      getPeriodState({
        id: "p1",
        startsOn: "2026-04-19T00:00:00.000Z",
        endsOn: "2026-04-21T23:59:59.999Z",
        weeklyTargetCount: 3,
        totalCompletedSessions: 0,
        weeks: [],
      }),
      "Aktiv idoszak",
    );
    assert.equal(
      getPeriodState({
        id: "p2",
        startsOn: "2026-04-22T00:00:00.000Z",
        endsOn: "2026-04-28T23:59:59.999Z",
        weeklyTargetCount: 3,
        totalCompletedSessions: 0,
        weeks: [],
      }),
      "Kovetkezo idoszak",
    );
    assert.equal(
      getPeriodState({
        id: "p3",
        startsOn: "2026-04-10T00:00:00.000Z",
        endsOn: "2026-04-18T23:59:59.999Z",
        weeklyTargetCount: 3,
        totalCompletedSessions: 0,
        weeks: [],
      }),
      "Lezart idoszak",
    );
  });
});

test("duration formatting handles nullish and normal values", () => {
  assert.equal(formatDuration(null), "—");
  assert.equal(formatDuration(undefined), "—");
  assert.equal(formatDuration(125), "2:05");
});

test("initials generation preserves current behavior", () => {
  assert.equal(getInitials("Anna", "Bela"), "AB");
  assert.equal(getInitials("", "Bela"), "B");
});

test("target session summing adds all weekly targets", () => {
  assert.equal(
    sumTargetSessions({
      id: "p1",
      startsOn: "2026-04-01T00:00:00.000Z",
      endsOn: "2026-04-30T23:59:59.999Z",
      weeklyTargetCount: 3,
      totalCompletedSessions: 0,
      weeks: [
        {
          weekStart: "2026-04-01T00:00:00.000Z",
          weekEnd: "2026-04-07T23:59:59.999Z",
          targetSessions: 2,
          completedSessions: 1,
          targetMet: false,
        },
        {
          weekStart: "2026-04-08T00:00:00.000Z",
          weekEnd: "2026-04-14T23:59:59.999Z",
          targetSessions: 3,
          completedSessions: 3,
          targetMet: true,
        },
      ],
    }),
    5,
  );
});

test("relevant period picking handles active, upcoming, latest past, and empty", () => {
  withMockedDate("2026-04-20T12:00:00.000Z", () => {
    assert.deepEqual(
      pickRelevantPeriod([
        {
          id: "active",
          startsOn: "2026-04-19T00:00:00.000Z",
          endsOn: "2026-04-21T23:59:59.999Z",
          weeklyTargetCount: 3,
          totalCompletedSessions: 0,
          weeks: [],
        },
      ]),
      {
        period: {
          id: "active",
          startsOn: "2026-04-19T00:00:00.000Z",
          endsOn: "2026-04-21T23:59:59.999Z",
          weeklyTargetCount: 3,
          totalCompletedSessions: 0,
          weeks: [],
        },
        state: "Aktiv szakasz",
      },
    );

    assert.deepEqual(
      pickRelevantPeriod([
        {
          id: "future",
          startsOn: "2026-04-25T00:00:00.000Z",
          endsOn: "2026-04-30T23:59:59.999Z",
          weeklyTargetCount: 3,
          totalCompletedSessions: 0,
          weeks: [],
        },
      ]).state,
      "Kovetkezo szakasz",
    );

    assert.deepEqual(
      pickRelevantPeriod([
        {
          id: "past-1",
          startsOn: "2026-04-01T00:00:00.000Z",
          endsOn: "2026-04-10T23:59:59.999Z",
          weeklyTargetCount: 3,
          totalCompletedSessions: 0,
          weeks: [],
        },
        {
          id: "past-2",
          startsOn: "2026-04-11T00:00:00.000Z",
          endsOn: "2026-04-18T23:59:59.999Z",
          weeklyTargetCount: 3,
          totalCompletedSessions: 0,
          weeks: [],
        },
      ]).period?.id,
      "past-2",
    );

    assert.deepEqual(pickRelevantPeriod([]), { period: null, state: "Nincs szakasz" });
  });
});

test("current week picking handles active week, fallback first week, and null period", () => {
  withMockedDate("2026-04-10T12:00:00.000Z", () => {
    const period = {
      id: "p1",
      startsOn: "2026-04-01T00:00:00.000Z",
      endsOn: "2026-04-30T23:59:59.999Z",
      weeklyTargetCount: 3,
      totalCompletedSessions: 0,
      weeks: [
        {
          weekStart: "2026-04-01T00:00:00.000Z",
          weekEnd: "2026-04-07T23:59:59.999Z",
          targetSessions: 2,
          completedSessions: 1,
          targetMet: false,
        },
        {
          weekStart: "2026-04-08T00:00:00.000Z",
          weekEnd: "2026-04-14T23:59:59.999Z",
          targetSessions: 3,
          completedSessions: 2,
          targetMet: false,
        },
      ],
    };

    assert.equal(pickCurrentWeek(period)?.weekStart, "2026-04-08T00:00:00.000Z");
  });

  withMockedDate("2026-05-10T12:00:00.000Z", () => {
    const period = {
      id: "p1",
      startsOn: "2026-04-01T00:00:00.000Z",
      endsOn: "2026-04-30T23:59:59.999Z",
      weeklyTargetCount: 3,
      totalCompletedSessions: 0,
      weeks: [
        {
          weekStart: "2026-04-01T00:00:00.000Z",
          weekEnd: "2026-04-07T23:59:59.999Z",
          targetSessions: 2,
          completedSessions: 1,
          targetMet: false,
        },
      ],
    };

    assert.equal(pickCurrentWeek(period)?.weekStart, "2026-04-01T00:00:00.000Z");
  });

  assert.equal(pickCurrentWeek(null), null);
});

test("progress square states cover done, pending, and missed", () => {
  assert.deepEqual(buildProgressSquares(3, 1, false, "week"), [
    { key: "week-0", state: "done" },
    { key: "week-1", state: "pending" },
    { key: "week-2", state: "pending" },
  ]);

  assert.deepEqual(buildProgressSquares(3, 1, true, "week"), [
    { key: "week-0", state: "done" },
    { key: "week-1", state: "missed" },
    { key: "week-2", state: "missed" },
  ]);
});
