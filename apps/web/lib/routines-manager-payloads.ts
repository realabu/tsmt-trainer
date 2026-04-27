import type { TaskDraft } from "../components/task-builder";
import { defaultPeriods, parseOptionalInt } from "./routines-manager-helpers";

type PeriodDraftLike = {
  id?: string;
  name: string;
  startsOn: string;
  endsOn: string;
  weeklyTargetCount: string;
};

export function buildRoutineTaskPayload(task: TaskDraft, sortOrder: number) {
  return {
    sortOrder,
    catalogTaskId: task.catalogTaskId || undefined,
    catalogDifficultyLevelId: task.catalogDifficultyLevelId || undefined,
    songId: task.songSelection === "__DEFAULT__" ? undefined : task.songSelection,
    title: task.title || undefined,
    details: task.details || undefined,
    coachText: task.coachText || undefined,
    repetitionsLabel: task.repetitionsLabel || undefined,
    repetitionCount: parseOptionalInt(task.repetitionCount),
    repetitionUnitCount: parseOptionalInt(task.repetitionUnitCount),
    customImageExternalUrl: task.mediaImageUrl || undefined,
    mediaLinks: [
      task.mediaAudioUrl
        ? { kind: "AUDIO" as const, label: "Feladat hang", externalUrl: task.mediaAudioUrl }
        : null,
      task.mediaVideoUrl
        ? { kind: "VIDEO" as const, label: "Feladat video", externalUrl: task.mediaVideoUrl }
        : null,
    ].filter((value): value is NonNullable<typeof value> => Boolean(value)),
  };
}

export function buildRoutinePeriodPayload(period: PeriodDraftLike) {
  return {
    name: period.name || undefined,
    startsOn: period.startsOn,
    endsOn: period.endsOn,
    weeklyTargetCount: parseOptionalInt(period.weeklyTargetCount) ?? 1,
  };
}

export function buildCreateRoutinePayload(input: {
  childId: string;
  name: string;
  description: string;
  tasks: TaskDraft[];
}) {
  return {
    childId: input.childId,
    name: input.name,
    description: input.description,
    tasks: input.tasks.map((task, index) => buildRoutineTaskPayload(task, index + 1)),
    periods: defaultPeriods,
  };
}
