import type { TaskDraft } from "../components/task-builder";
import { getDisplayRepetitionsLabel } from "./repetitions";

export const defaultPeriods = [
  { name: "Indulo szakasz", startsOn: "2026-04-01", endsOn: "2026-04-21", weeklyTargetCount: 3 },
];

export function parseOptionalInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

type RoutineTaskDraftSource = {
  id: string;
  catalogTaskId?: string | null;
  title: string;
  details?: string | null;
  coachText?: string | null;
  sortOrder: number;
  repetitionsLabel?: string | null;
  repetitionCount?: number | null;
  repetitionUnitCount?: number | null;
  song?: {
    id: string;
    title: string;
  } | null;
  catalogTask?: {
    id: string;
    title: string;
    defaultSong?: {
      id: string;
      title: string;
    } | null;
    difficultyLevels?: Array<{
      id: string;
      name: string;
      description?: string | null;
    }>;
  } | null;
  catalogDifficultyLevel?: {
    id: string;
  } | null;
  customImageMedia?: {
    externalUrl?: string | null;
  } | null;
  mediaLinks?: Array<{
    id: string;
    label?: string | null;
    mediaAsset: {
      kind: string;
      externalUrl?: string | null;
    };
  }>;
};

type RoutinePeriodDraftSource = {
  id: string;
  name?: string | null;
  weeklyTargetCount: number;
  startsOn: string;
  endsOn: string;
};

export function routineTaskToDraft(task: RoutineTaskDraftSource, index: number): TaskDraft {
  const imageLink =
    task.customImageMedia?.externalUrl ??
    task.mediaLinks?.find((mediaLink) => mediaLink.mediaAsset.kind === "IMAGE")?.mediaAsset.externalUrl ??
    "";
  const audioLink =
    task.mediaLinks?.find((mediaLink) => mediaLink.mediaAsset.kind === "AUDIO")?.mediaAsset.externalUrl ?? "";
  const videoLink =
    task.mediaLinks?.find((mediaLink) => mediaLink.mediaAsset.kind === "VIDEO")?.mediaAsset.externalUrl ?? "";
  const catalogDefaultSongId = task.catalogTask?.defaultSong?.id;
  const selectedSongId = task.song?.id;

  return {
    id: task.id,
    sortOrder: task.sortOrder ?? index + 1,
    catalogTaskId: task.catalogTaskId ?? undefined,
    catalogTaskTitle: task.catalogTask?.title ?? undefined,
    catalogDifficultyLevelId: task.catalogDifficultyLevel?.id ?? undefined,
    catalogDifficultyLevels: task.catalogTask?.difficultyLevels ?? [],
    catalogDefaultSongId: catalogDefaultSongId ?? undefined,
    catalogDefaultSongTitle: task.catalogTask?.defaultSong?.title ?? undefined,
    songSelection:
      selectedSongId && catalogDefaultSongId && selectedSongId === catalogDefaultSongId
        ? "__DEFAULT__"
        : selectedSongId ?? "",
    title: task.title,
    details: task.details ?? "",
    coachText: task.coachText ?? "",
    repetitionsLabel:
      task.repetitionsLabel ??
      getDisplayRepetitionsLabel({
        repetitionsLabel: task.repetitionsLabel,
        repetitionCount: task.repetitionCount,
        repetitionUnitCount: task.repetitionUnitCount,
      }),
    repetitionCount: task.repetitionCount?.toString() ?? "",
    repetitionUnitCount: task.repetitionUnitCount?.toString() ?? "",
    mediaImageUrl: imageLink ?? "",
    mediaAudioUrl: audioLink ?? "",
    mediaVideoUrl: videoLink ?? "",
  };
}

export function routinePeriodToDraft(period: RoutinePeriodDraftSource) {
  return {
    id: period.id,
    name: period.name ?? "",
    startsOn: period.startsOn.slice(0, 10),
    endsOn: period.endsOn.slice(0, 10),
    weeklyTargetCount: period.weeklyTargetCount.toString(),
  };
}
