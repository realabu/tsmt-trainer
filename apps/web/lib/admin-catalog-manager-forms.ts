export interface AdminCatalogMediaAssetRecord {
  id: string;
  externalUrl?: string | null;
}

export interface AdminCatalogSongRecord {
  id: string;
  title: string;
  lyrics?: string | null;
  notes?: string | null;
  isActive: boolean;
  audioMedia?: AdminCatalogMediaAssetRecord | null;
  videoMedia?: AdminCatalogMediaAssetRecord | null;
}

export interface AdminCatalogEquipmentRecord {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  iconMedia?: AdminCatalogMediaAssetRecord | null;
}

export interface AdminCatalogTaskRecord {
  id: string;
  title: string;
  summary?: string | null;
  instructions?: string | null;
  focusPoints?: string | null;
  demoVideoUrl?: string | null;
  isActive: boolean;
  defaultSongId?: string | null;
  mediaLinks: Array<{
    id: string;
    label?: string | null;
    mediaAsset: AdminCatalogMediaAssetRecord;
  }>;
  equipmentLinks: Array<{
    equipmentCatalogItem: AdminCatalogEquipmentRecord;
  }>;
  difficultyLevels: Array<{
    id: string;
    name: string;
    description?: string | null;
    sortOrder: number;
  }>;
}

export interface AdminCatalogDifficultyLevelDraft {
  name: string;
  description: string;
}

export interface AdminTaskCatalogFormState {
  title: string;
  summary: string;
  instructions: string;
  focusPoints: string;
  demoVideoUrl: string;
  defaultSongId: string;
  imageUrls: string;
  equipmentIds: string[];
  difficultyLevels: AdminCatalogDifficultyLevelDraft[];
  isActive: boolean;
}

export interface AdminSongCatalogFormState {
  title: string;
  lyrics: string;
  audioExternalUrl: string;
  videoExternalUrl: string;
  notes: string;
  isActive: boolean;
}

export interface AdminEquipmentCatalogFormState {
  name: string;
  description: string;
  iconExternalUrl: string;
  isActive: boolean;
}

export function createEmptyTaskCatalogForm(): AdminTaskCatalogFormState {
  return {
    title: "",
    summary: "",
    instructions: "",
    focusPoints: "",
    demoVideoUrl: "",
    defaultSongId: "",
    imageUrls: "",
    equipmentIds: [],
    difficultyLevels: [],
    isActive: true,
  };
}

export function createEmptySongCatalogForm(): AdminSongCatalogFormState {
  return {
    title: "",
    lyrics: "",
    audioExternalUrl: "",
    videoExternalUrl: "",
    notes: "",
    isActive: true,
  };
}

export function createEmptyEquipmentCatalogForm(): AdminEquipmentCatalogFormState {
  return {
    name: "",
    description: "",
    iconExternalUrl: "",
    isActive: true,
  };
}

export function createTaskCatalogFormFromRecord(
  task: AdminCatalogTaskRecord,
): AdminTaskCatalogFormState {
  return {
    title: task.title,
    summary: task.summary ?? "",
    instructions: task.instructions ?? "",
    focusPoints: task.focusPoints ?? "",
    demoVideoUrl: task.demoVideoUrl ?? "",
    defaultSongId: task.defaultSongId ?? "",
    imageUrls: task.mediaLinks
      .map((link) => link.mediaAsset.externalUrl)
      .filter((url): url is string => Boolean(url))
      .join("\n"),
    equipmentIds: task.equipmentLinks.map((link) => link.equipmentCatalogItem.id),
    difficultyLevels: task.difficultyLevels.map((level) => ({
      name: level.name,
      description: level.description ?? "",
    })),
    isActive: task.isActive,
  };
}

export function createSongCatalogFormFromRecord(
  song: AdminCatalogSongRecord,
): AdminSongCatalogFormState {
  return {
    title: song.title,
    lyrics: song.lyrics ?? "",
    audioExternalUrl: song.audioMedia?.externalUrl ?? "",
    videoExternalUrl: song.videoMedia?.externalUrl ?? "",
    notes: song.notes ?? "",
    isActive: song.isActive,
  };
}

export function createEquipmentCatalogFormFromRecord(
  equipment: AdminCatalogEquipmentRecord,
): AdminEquipmentCatalogFormState {
  return {
    name: equipment.name,
    description: equipment.description ?? "",
    iconExternalUrl: equipment.iconMedia?.externalUrl ?? "",
    isActive: equipment.isActive,
  };
}

export function buildTaskCatalogMediaLinks(imageUrls: string) {
  return imageUrls
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((externalUrl) => ({
      kind: "IMAGE" as const,
      externalUrl,
      label: "Alapertelmezett kep",
    }));
}

export function buildTaskCatalogSavePayload(form: AdminTaskCatalogFormState) {
  return {
    title: form.title,
    summary: form.summary || undefined,
    instructions: form.instructions || undefined,
    focusPoints: form.focusPoints || undefined,
    demoVideoUrl: form.demoVideoUrl || undefined,
    defaultSongId: form.defaultSongId || undefined,
    isActive: form.isActive,
    equipmentIds: form.equipmentIds,
    mediaLinks: buildTaskCatalogMediaLinks(form.imageUrls),
    difficultyLevels: form.difficultyLevels
      .filter((level) => level.name.trim())
      .map((level, index) => ({
        name: level.name.trim(),
        description: level.description.trim() || undefined,
        sortOrder: index,
      })),
  };
}

export function buildSongCatalogSavePayload(form: AdminSongCatalogFormState) {
  return {
    title: form.title,
    lyrics: form.lyrics || undefined,
    audioExternalUrl: form.audioExternalUrl || undefined,
    videoExternalUrl: form.videoExternalUrl || undefined,
    notes: form.notes || undefined,
    isActive: form.isActive,
  };
}

export function buildEquipmentCatalogSavePayload(
  form: AdminEquipmentCatalogFormState,
) {
  return {
    name: form.name,
    description: form.description || undefined,
    iconExternalUrl: form.iconExternalUrl || undefined,
    isActive: form.isActive,
  };
}
