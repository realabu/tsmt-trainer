import { MediaKind } from "@prisma/client";
import { parseRoutineTaskMediaKind } from "./media-kind";

export type RoutineTaskMediaLinkInput = {
  kind: "IMAGE" | "AUDIO" | "VIDEO" | "EXTERNAL_LINK";
  label?: string;
  externalUrl: string;
};

export type ResolvedRoutineTaskInput = {
  sortOrder: number;
  catalogTaskId: string | null;
  catalogDifficultyLevelId: string | null;
  songId: string | null;
  title: string;
  details: string | null | undefined;
  coachText: string | null | undefined;
  repetitionsLabel: string | null;
  repetitionCount: number | null;
  repetitionUnitCount: number | null;
  customImageExternalUrl: string | null;
  mediaLinks: RoutineTaskMediaLinkInput[];
};

export type RoutineTaskResolvedValueInput = {
  sortOrder?: number;
  catalogTaskId?: string;
  catalogDifficultyLevelId?: string;
  repetitionCount?: number;
  repetitionUnitCount?: number;
  customImageExternalUrl?: string;
  mediaLinks?: RoutineTaskMediaLinkInput[];
};

export type RoutineTaskDisplayValueInput = {
  title: string;
  details: string | null | undefined;
  coachText: string | null | undefined;
};

export function buildResolvedRoutineTaskInput(
  input: RoutineTaskResolvedValueInput,
  defaultSortOrder: number,
  displayFields: RoutineTaskDisplayValueInput,
  resolvedSongId: string | null | undefined,
  repetitionsLabel: string | null,
): ResolvedRoutineTaskInput {
  return {
    sortOrder: input.sortOrder ?? defaultSortOrder,
    catalogTaskId: input.catalogTaskId || null,
    catalogDifficultyLevelId: input.catalogDifficultyLevelId || null,
    songId: resolvedSongId ?? null,
    title: displayFields.title,
    details: displayFields.details,
    coachText: displayFields.coachText,
    repetitionsLabel,
    repetitionCount: input.repetitionCount ?? null,
    repetitionUnitCount: input.repetitionUnitCount ?? null,
    customImageExternalUrl: input.customImageExternalUrl || null,
    mediaLinks: input.mediaLinks ?? [],
  };
}

export function buildRoutineTaskMediaLinkCreates(mediaLinks: RoutineTaskMediaLinkInput[]) {
  return mediaLinks.map((media, mediaIndex) => ({
    label: media.label,
    sortOrder: mediaIndex,
    mediaAsset: {
      create: {
        kind: parseRoutineTaskMediaKind(media.kind),
        externalUrl: media.externalUrl,
      },
    },
  }));
}

export function buildRoutineTaskCreateData(
  task: ResolvedRoutineTaskInput,
  currentMaxSortOrder = 0,
) {
  const sortOrder = task.sortOrder || currentMaxSortOrder + 1;

  return {
    sortOrder,
    catalogTaskId: task.catalogTaskId,
    catalogDifficultyLevelId: task.catalogDifficultyLevelId,
    songId: task.songId,
    title: task.title,
    details: task.details,
    coachText: task.coachText,
    repetitionsLabel: task.repetitionsLabel,
    repetitionCount: task.repetitionCount,
    repetitionUnitCount: task.repetitionUnitCount,
    customImageMedia: task.customImageExternalUrl
      ? {
          create: {
            kind: MediaKind.IMAGE,
            externalUrl: task.customImageExternalUrl,
          },
        }
      : undefined,
    mediaLinks: {
      create: buildRoutineTaskMediaLinkCreates(task.mediaLinks),
    },
  };
}
