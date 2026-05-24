import type { TaskDraft } from "../components/task-builder";

export type TaskBuilderCatalogTask = {
  id: string;
  title: string;
  summary?: string | null;
  defaultSong?: {
    id: string;
    title: string;
  } | null;
  difficultyLevels: Array<{
    id: string;
    name: string;
    description?: string | null;
  }>;
};

export function createEmptyTaskDraft(sortOrder: number): TaskDraft {
  return {
    sortOrder,
    songSelection: "",
    title: "",
    details: "",
    coachText: "",
    repetitionsLabel: "",
    repetitionCount: "",
    repetitionUnitCount: "",
    mediaImageUrl: "",
    mediaAudioUrl: "",
    mediaVideoUrl: "",
  };
}

export function createCatalogTaskDraft(item: TaskBuilderCatalogTask, sortOrder: number): TaskDraft {
  return {
    ...createEmptyTaskDraft(sortOrder),
    catalogTaskId: item.id,
    catalogTaskTitle: item.title,
    catalogDifficultyLevels: item.difficultyLevels,
    catalogDefaultSongId: item.defaultSong?.id,
    catalogDefaultSongTitle: item.defaultSong?.title,
    songSelection: item.defaultSong?.id ? "__DEFAULT__" : "",
    title: item.title,
    details: item.summary ?? "",
  };
}

export function normalizeTaskDraftOrder(tasks: TaskDraft[]) {
  return tasks.map((task, index) => ({
    ...task,
    sortOrder: index + 1,
  }));
}

export function deriveUsedCatalogTaskIds(tasks: TaskDraft[]) {
  return new Set(tasks.map((task) => task.catalogTaskId).filter((value): value is string => Boolean(value)));
}

export function canAddCatalogTask(tasks: TaskDraft[], catalogTaskId: string) {
  return !deriveUsedCatalogTaskIds(tasks).has(catalogTaskId);
}
