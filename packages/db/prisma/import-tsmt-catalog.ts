import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import prismaClient from "@prisma/client";

const { PrismaClient, MediaKind } = prismaClient;

const prisma = new PrismaClient();

interface CatalogSongInput {
  title: string;
  lyrics?: string;
  audioExternalUrl?: string;
  videoExternalUrl?: string;
  notes?: string;
}

interface CatalogEquipmentInput {
  name: string;
  description?: string;
  iconExternalUrl?: string;
}

interface CatalogDifficultyLevelInput {
  name: string;
  description?: string;
}

interface CatalogTaskInput {
  title: string;
  summary?: string;
  instructions?: string;
  focusPoints?: string;
  demoVideoUrl?: string;
  defaultSongTitle?: string;
  imageUrls?: string[];
  equipmentNames?: string[];
  difficultyLevels?: CatalogDifficultyLevelInput[];
}

interface CatalogPayload {
  songs: CatalogSongInput[];
  equipment: CatalogEquipmentInput[];
  tasks: CatalogTaskInput[];
}

function normalizePublicAssetUrl(value: string) {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }

  return `/catalog/task-icons/${value.replace(/^icons\//, "")}`;
}

async function upsertSong(song: CatalogSongInput) {
  const existing = await prisma.songCatalogItem.findFirst({
    where: {
      title: song.title,
    },
    select: {
      id: true,
      audioMediaId: true,
      videoMediaId: true,
    },
  });

  const audioUrl = song.audioExternalUrl?.trim();
  const videoUrl = song.videoExternalUrl?.trim();

  if (!existing) {
    return prisma.songCatalogItem.create({
      data: {
        title: song.title,
        lyrics: song.lyrics?.trim() || null,
        notes: song.notes?.trim() || null,
        isActive: true,
        audioMedia: audioUrl
          ? {
              create: {
                kind: MediaKind.AUDIO,
                externalUrl: audioUrl,
              },
            }
          : undefined,
        videoMedia: videoUrl
          ? {
              create: {
                kind: MediaKind.VIDEO,
                externalUrl: videoUrl,
              },
            }
          : undefined,
      },
    });
  }

  return prisma.songCatalogItem.update({
    where: { id: existing.id },
    data: {
      title: song.title,
      lyrics: song.lyrics?.trim() || null,
      notes: song.notes?.trim() || null,
      isActive: true,
      audioMedia: audioUrl
        ? existing.audioMediaId
          ? {
              update: {
                kind: MediaKind.AUDIO,
                externalUrl: audioUrl,
              },
            }
          : {
              create: {
                kind: MediaKind.AUDIO,
                externalUrl: audioUrl,
              },
            }
        : existing.audioMediaId
          ? { disconnect: true }
          : undefined,
      videoMedia: videoUrl
        ? existing.videoMediaId
          ? {
              update: {
                kind: MediaKind.VIDEO,
                externalUrl: videoUrl,
              },
            }
          : {
              create: {
                kind: MediaKind.VIDEO,
                externalUrl: videoUrl,
              },
            }
        : existing.videoMediaId
          ? { disconnect: true }
          : undefined,
    },
  });
}

async function upsertEquipment(item: CatalogEquipmentInput) {
  const existing = await prisma.equipmentCatalogItem.findFirst({
    where: {
      name: item.name,
    },
    select: {
      id: true,
      iconMediaId: true,
    },
  });

  const iconUrl = item.iconExternalUrl?.trim();

  if (!existing) {
    return prisma.equipmentCatalogItem.create({
      data: {
        name: item.name,
        description: item.description?.trim() || null,
        isActive: true,
        iconMedia: iconUrl
          ? {
              create: {
                kind: MediaKind.IMAGE,
                externalUrl: iconUrl,
              },
            }
          : undefined,
      },
    });
  }

  return prisma.equipmentCatalogItem.update({
    where: { id: existing.id },
    data: {
      name: item.name,
      description: item.description?.trim() || null,
      isActive: true,
      iconMedia: iconUrl
        ? existing.iconMediaId
          ? {
              update: {
                kind: MediaKind.IMAGE,
                externalUrl: iconUrl,
              },
            }
          : {
              create: {
                kind: MediaKind.IMAGE,
                externalUrl: iconUrl,
              },
            }
        : existing.iconMediaId
          ? { disconnect: true }
          : undefined,
    },
  });
}

async function upsertTask(
  task: CatalogTaskInput,
  songIdsByTitle: Map<string, string>,
  equipmentIdsByName: Map<string, string>,
) {
  const existing = await prisma.taskCatalogItem.findFirst({
    where: {
      title: task.title,
    },
    select: {
      id: true,
    },
  });

  const imageUrls = (task.imageUrls ?? []).map((item) => normalizePublicAssetUrl(item.trim())).filter(Boolean);
  const equipmentIds = (task.equipmentNames ?? [])
    .map((name) => equipmentIdsByName.get(name))
    .filter((value): value is string => Boolean(value));
  const defaultSongId = task.defaultSongTitle ? songIdsByTitle.get(task.defaultSongTitle) ?? null : null;

  if (!existing) {
    return prisma.taskCatalogItem.create({
      data: {
        title: task.title,
        summary: task.summary?.trim() || null,
        instructions: task.instructions?.trim() || null,
        focusPoints: task.focusPoints?.trim() || null,
        demoVideoUrl: task.demoVideoUrl?.trim() || null,
        defaultSongId,
        isActive: true,
        mediaLinks: {
          create: imageUrls.map((externalUrl, index) => ({
            sortOrder: index,
            label: "Feladatkep",
            mediaAsset: {
              create: {
                kind: MediaKind.IMAGE,
                externalUrl,
              },
            },
          })),
        },
        equipmentLinks: {
          create: equipmentIds.map((equipmentCatalogItemId) => ({
            equipmentCatalogItemId,
          })),
        },
        difficultyLevels: {
          create: (task.difficultyLevels ?? [])
            .filter((level) => level.name.trim())
            .map((level, index) => ({
              name: level.name.trim(),
              description: level.description?.trim() || null,
              sortOrder: index,
            })),
        },
      },
    });
  }

  await prisma.taskCatalogMediaLink.deleteMany({
    where: {
      taskCatalogItemId: existing.id,
    },
  });
  await prisma.taskCatalogEquipment.deleteMany({
    where: {
      taskCatalogItemId: existing.id,
    },
  });
  await prisma.taskCatalogDifficultyLevel.deleteMany({
    where: {
      taskCatalogItemId: existing.id,
    },
  });

  return prisma.taskCatalogItem.update({
    where: { id: existing.id },
    data: {
      title: task.title,
      summary: task.summary?.trim() || null,
      instructions: task.instructions?.trim() || null,
      focusPoints: task.focusPoints?.trim() || null,
      demoVideoUrl: task.demoVideoUrl?.trim() || null,
      defaultSongId,
      isActive: true,
      mediaLinks: {
        create: imageUrls.map((externalUrl, index) => ({
          sortOrder: index,
          label: "Feladatkep",
          mediaAsset: {
            create: {
              kind: MediaKind.IMAGE,
              externalUrl,
            },
          },
        })),
      },
      equipmentLinks: {
        create: equipmentIds.map((equipmentCatalogItemId) => ({
          equipmentCatalogItemId,
        })),
      },
      difficultyLevels: {
        create: (task.difficultyLevels ?? [])
          .filter((level) => level.name.trim())
          .map((level, index) => ({
            name: level.name.trim(),
            description: level.description?.trim() || null,
            sortOrder: index,
          })),
      },
    },
  });
}

async function main() {
  const sourcePath = resolve(process.cwd(), "data/tsmt_catalog.json");
  const raw = await readFile(sourcePath, "utf8");
  const payload = JSON.parse(raw) as CatalogPayload;

  const songIdsByTitle = new Map<string, string>();
  const equipmentIdsByName = new Map<string, string>();

  for (const song of payload.songs) {
    const record = await upsertSong(song);
    songIdsByTitle.set(record.title, record.id);
  }

  for (const equipment of payload.equipment) {
    const record = await upsertEquipment(equipment);
    equipmentIdsByName.set(record.name, record.id);
  }

  for (const task of payload.tasks) {
    await upsertTask(task, songIdsByTitle, equipmentIdsByName);
  }

  console.log(
    `TSMT katalogus import kesz: ${payload.songs.length} dal, ${payload.equipment.length} eszkoz, ${payload.tasks.length} feladat.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
