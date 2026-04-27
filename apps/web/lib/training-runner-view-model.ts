import { getDisplayRepetitionsLabel } from "./repetitions";
import { buildCurrentTaskImages } from "./training-runner-task-images";

type TaskMediaLinkRecord = {
  id: string;
  label?: string | null;
  mediaAsset: {
    kind: string;
    externalUrl?: string | null;
  };
};

type SongRecord = {
  id: string;
  title: string;
  lyrics?: string | null;
  notes?: string | null;
  audioMedia?: {
    externalUrl?: string | null;
  } | null;
  videoMedia?: {
    externalUrl?: string | null;
  } | null;
};

type EquipmentRecord = {
  id: string;
  name: string;
  description?: string | null;
  iconMedia?: {
    externalUrl?: string | null;
  } | null;
};

type DifficultyLevelRecord = {
  id: string;
  name: string;
  description?: string | null;
};

export type TrainingRunnerTaskViewModelInput = {
  id: string;
  sortOrder: number;
  title: string;
  details?: string | null;
  coachText?: string | null;
  repetitionsLabel?: string | null;
  repetitionCount?: number | null;
  repetitionUnitCount?: number | null;
  expectedSeconds?: number | null;
  customImageMedia?: {
    externalUrl?: string | null;
  } | null;
  mediaLinks?: TaskMediaLinkRecord[];
  song?: SongRecord | null;
  catalogDifficultyLevel?: DifficultyLevelRecord | null;
  catalogTask?: {
    summary?: string | null;
    instructions?: string | null;
    focusPoints?: string | null;
    demoVideoUrl?: string | null;
    defaultSong?: SongRecord | null;
    mediaLinks: TaskMediaLinkRecord[];
    equipmentLinks: Array<{
      equipmentCatalogItem: EquipmentRecord;
    }>;
  } | null;
};

export function buildTrainingRunnerViewModel(input: {
  tasks: TrainingRunnerTaskViewModelInput[];
  completedCount: number;
  totalTaskCount: number;
  isFinished: boolean;
  activeImageIndex: number | null;
}) {
  const currentTask = input.tasks[input.completedCount] ?? null;
  const nextTask = input.tasks[input.completedCount + 1] ?? null;
  const currentTaskImages = buildCurrentTaskImages(currentTask);
  const selectedImage =
    input.activeImageIndex == null ? null : currentTaskImages[input.activeImageIndex] ?? null;
  const effectiveSong = currentTask?.song ?? currentTask?.catalogTask?.defaultSong ?? null;
  const demoVideoUrl = currentTask?.catalogTask?.demoVideoUrl ?? null;
  const equipment =
    currentTask?.catalogTask?.equipmentLinks.map((item) => item.equipmentCatalogItem) ?? [];
  const currentTaskRepetitionsLabel = currentTask ? getDisplayRepetitionsLabel(currentTask) : "";
  const progressPercent = input.totalTaskCount
    ? Math.round((input.completedCount / input.totalTaskCount) * 100)
    : 0;
  const finishActionLabel = input.isFinished
    ? "Uj torna inditasa"
    : nextTask
      ? "Kovetkezo feladat"
      : "Torna befejezese";
  const canAdvance = !input.isFinished || input.totalTaskCount === 0 || currentTask == null;

  return {
    currentTask,
    nextTask,
    currentTaskImages,
    selectedImage,
    effectiveSong,
    demoVideoUrl,
    equipment,
    currentTaskRepetitionsLabel,
    progressPercent,
    finishActionLabel,
    canAdvance,
  };
}
