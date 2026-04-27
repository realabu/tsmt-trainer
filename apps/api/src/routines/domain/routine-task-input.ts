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
