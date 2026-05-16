import type { Prisma } from "@prisma/client";

export function buildRoutineTaskCatalogSearchWhere(query?: string): Prisma.TaskCatalogItemWhereInput {
  const q = query?.trim();

  if (!q) {
    return { isActive: true };
  }

  return {
    isActive: true,
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { instructions: { contains: q, mode: "insensitive" } },
      { focusPoints: { contains: q, mode: "insensitive" } },
      { demoVideoUrl: { contains: q, mode: "insensitive" } },
      {
        defaultSong: {
          is: {
            title: { contains: q, mode: "insensitive" },
          },
        },
      },
      {
        equipmentLinks: {
          some: {
            equipmentCatalogItem: {
              name: { contains: q, mode: "insensitive" },
            },
          },
        },
      },
      {
        difficultyLevels: {
          some: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  };
}
