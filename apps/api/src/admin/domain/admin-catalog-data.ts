import { MediaKind } from "@prisma/client";
import { buildAdminCatalogMediaCreate } from "./admin-catalog-media";

type AdminCatalogMediaInput = {
  kind: "IMAGE" | "AUDIO" | "VIDEO" | "EXTERNAL_LINK";
  externalUrl?: string | null;
  label?: string;
};

type AdminDifficultyLevelInput = {
  name: string;
  description?: string;
  sortOrder?: number;
};

function buildOptionalMediaCreateRelation(
  kind: MediaKind,
  externalUrl: string | null | undefined,
) {
  if (!externalUrl) {
    return undefined;
  }

  return {
    create: {
      kind,
      externalUrl,
    },
  };
}

function buildOptionalMediaUpdateRelation(
  kind: MediaKind,
  externalUrl: string | null | undefined,
) {
  if (externalUrl === undefined) {
    return undefined;
  }

  if (externalUrl) {
    return {
      create: {
        kind,
        externalUrl,
      },
    };
  }

  return { disconnect: true };
}

export function buildTaskCatalogMediaLinkCreates(mediaLinks: AdminCatalogMediaInput[] = []) {
  return mediaLinks.map((media, index) => ({
    label: media.label,
    ...buildAdminCatalogMediaCreate(media, index),
  }));
}

export function buildTaskCatalogEquipmentLinkCreates(equipmentIds: string[] = []) {
  return equipmentIds.map((equipmentCatalogItemId) => ({
    equipmentCatalogItemId,
  }));
}

export function buildTaskCatalogDifficultyLevelCreates(
  difficultyLevels: AdminDifficultyLevelInput[] = [],
) {
  return difficultyLevels.map((level, index) => ({
    name: level.name,
    description: level.description,
    sortOrder: level.sortOrder ?? index,
  }));
}

export function buildSongAudioMediaCreateRelation(audioExternalUrl: string | null | undefined) {
  return buildOptionalMediaCreateRelation(MediaKind.AUDIO, audioExternalUrl);
}

export function buildSongAudioMediaUpdateRelation(audioExternalUrl: string | null | undefined) {
  return buildOptionalMediaUpdateRelation(MediaKind.AUDIO, audioExternalUrl);
}

export function buildSongVideoMediaCreateRelation(videoExternalUrl: string | null | undefined) {
  return buildOptionalMediaCreateRelation(MediaKind.VIDEO, videoExternalUrl);
}

export function buildSongVideoMediaUpdateRelation(videoExternalUrl: string | null | undefined) {
  return buildOptionalMediaUpdateRelation(MediaKind.VIDEO, videoExternalUrl);
}

export function buildEquipmentIconMediaCreateRelation(iconExternalUrl: string | null | undefined) {
  return buildOptionalMediaCreateRelation(MediaKind.IMAGE, iconExternalUrl);
}

export function buildEquipmentIconMediaUpdateRelation(iconExternalUrl: string | null | undefined) {
  return buildOptionalMediaUpdateRelation(MediaKind.IMAGE, iconExternalUrl);
}
