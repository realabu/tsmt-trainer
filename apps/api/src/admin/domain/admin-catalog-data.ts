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
  if (!audioExternalUrl) {
    return undefined;
  }

  return {
    create: {
      kind: MediaKind.AUDIO,
      externalUrl: audioExternalUrl,
    },
  };
}

export function buildSongAudioMediaUpdateRelation(audioExternalUrl: string | null | undefined) {
  if (audioExternalUrl === undefined) {
    return undefined;
  }

  if (audioExternalUrl) {
    return {
      create: {
        kind: MediaKind.AUDIO,
        externalUrl: audioExternalUrl,
      },
    };
  }

  return { disconnect: true };
}

export function buildSongVideoMediaCreateRelation(videoExternalUrl: string | null | undefined) {
  if (!videoExternalUrl) {
    return undefined;
  }

  return {
    create: {
      kind: MediaKind.VIDEO,
      externalUrl: videoExternalUrl,
    },
  };
}

export function buildSongVideoMediaUpdateRelation(videoExternalUrl: string | null | undefined) {
  if (videoExternalUrl === undefined) {
    return undefined;
  }

  if (videoExternalUrl) {
    return {
      create: {
        kind: MediaKind.VIDEO,
        externalUrl: videoExternalUrl,
      },
    };
  }

  return { disconnect: true };
}

export function buildEquipmentIconMediaCreateRelation(iconExternalUrl: string | null | undefined) {
  if (!iconExternalUrl) {
    return undefined;
  }

  return {
    create: {
      kind: MediaKind.IMAGE,
      externalUrl: iconExternalUrl,
    },
  };
}

export function buildEquipmentIconMediaUpdateRelation(iconExternalUrl: string | null | undefined) {
  if (iconExternalUrl === undefined) {
    return undefined;
  }

  if (iconExternalUrl) {
    return {
      create: {
        kind: MediaKind.IMAGE,
        externalUrl: iconExternalUrl,
      },
    };
  }

  return { disconnect: true };
}
