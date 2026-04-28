import type { CreateTaskCatalogDto, UpdateTaskCatalogDto } from "../dto";

export function buildTaskCatalogCreateData(input: CreateTaskCatalogDto) {
  return {
    title: input.title,
    summary: input.summary,
    instructions: input.instructions,
    focusPoints: input.focusPoints,
    demoVideoUrl: input.demoVideoUrl,
    defaultSongId: input.defaultSongId,
    isActive: input.isActive ?? true,
  };
}

export function buildTaskCatalogUpdateScalarData(input: Partial<UpdateTaskCatalogDto>) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
    ...(input.focusPoints !== undefined ? { focusPoints: input.focusPoints } : {}),
    ...(input.demoVideoUrl !== undefined ? { demoVideoUrl: input.demoVideoUrl } : {}),
    ...(input.defaultSongId !== undefined
      ? { defaultSongId: input.defaultSongId || null }
      : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
}
