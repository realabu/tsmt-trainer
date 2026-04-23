export function buildRoutineDeleteImpact(input: {
  routineId: string;
  routineName: string;
  childFirstName: string;
  childLastName: string;
  taskCount: number;
  taskMediaLinkCount: number;
  periodCount: number;
  sessionCount: number;
  sessionTaskTimingCount: number;
  trainerAssignmentCount: number;
  detachedBadgeAwardCount: number;
}) {
  return {
    entityType: "routine",
    entityId: input.routineId,
    entityLabel: input.routineName,
    parentLabel: `${input.childFirstName} ${input.childLastName}`,
    deletes: [
      { label: "Feladat", count: input.taskCount },
      { label: "Feladat media kapcsolat", count: input.taskMediaLinkCount },
      { label: "Idoszak", count: input.periodCount },
      { label: "Torna", count: input.sessionCount },
      { label: "Reszido bejegyzes", count: input.sessionTaskTimingCount },
      { label: "Trainer megosztas", count: input.trainerAssignmentCount },
    ],
    detaches: [
      { label: "Badge megszerzes kapcsolat", count: input.detachedBadgeAwardCount },
    ],
    notes: [
      "A badge megszerzesek gyermek szinten megmaradnak, de a torolt feladatsorhoz es idoszakokhoz valo kapcsolatuk megszunik.",
    ],
  };
}

export function buildRoutineTaskDeleteImpact(input: {
  taskId: string;
  taskTitle: string;
  routineName: string;
  childFirstName: string;
  childLastName: string;
  taskMediaLinkCount: number;
  sessionTimingCount: number;
}) {
  return {
    entityType: "task",
    entityId: input.taskId,
    entityLabel: input.taskTitle,
    parentLabel: `${input.childFirstName} ${input.childLastName} / ${input.routineName}`,
    deletes: [
      { label: "Feladat media kapcsolat", count: input.taskMediaLinkCount },
      { label: "Reszido bejegyzes", count: input.sessionTimingCount },
    ],
    detaches: [],
    notes: [
      "A feladat torlesevel a korabbi tornakhoz rogzitett ehhez tartozo reszidok is torlodnek.",
    ],
  };
}

export function buildRoutinePeriodDeleteImpact(input: {
  periodId: string;
  periodName: string | null;
  routineName: string;
  childFirstName: string;
  childLastName: string;
  detachedBadgeAwardCount: number;
  completedSessionCount: number;
}) {
  return {
    entityType: "period",
    entityId: input.periodId,
    entityLabel: input.periodName ?? "Nev nelkuli idoszak",
    parentLabel: `${input.childFirstName} ${input.childLastName} / ${input.routineName}`,
    deletes: [],
    detaches: [
      { label: "Idoszakhoz kotott badge kapcsolat", count: input.detachedBadgeAwardCount },
    ],
    notes: [
      `${input.completedSessionCount} befejezett torna marad meg, de a torolt idoszak tobbe nem fog megjelenni a haladasi nezetekben.`,
    ],
  };
}
