import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import {
  buildEquipmentIconMediaCreateRelation,
  buildEquipmentIconMediaUpdateRelation,
  buildSongAudioMediaCreateRelation,
  buildSongAudioMediaUpdateRelation,
  buildSongVideoMediaCreateRelation,
  buildSongVideoMediaUpdateRelation,
  buildTaskCatalogDifficultyLevelCreates,
  buildTaskCatalogEquipmentLinkCreates,
  buildTaskCatalogMediaLinkCreates,
} from "./domain/admin-catalog-data";
import {
  buildTaskCatalogCreateData,
  buildTaskCatalogUpdateScalarData,
} from "./domain/admin-task-catalog-data";
import type { AuthenticatedUser } from "../auth/auth.types";
import {
  CreateEquipmentCatalogDto,
  CreateSongCatalogDto,
  CreateTaskCatalogDto,
  UpdateEquipmentCatalogDto,
  UpdateSongCatalogDto,
  UpdateTaskCatalogDto,
} from "./dto";

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listTaskCatalog(_currentUser: AuthenticatedUser) {
    return this.prisma.taskCatalogItem.findMany({
      orderBy: [{ isActive: "desc" }, { title: "asc" }],
      include: this.taskCatalogInclude(),
    });
  }

  async getTaskCatalogDetail(_currentUser: AuthenticatedUser, taskCatalogId: string) {
    const task = await this.prisma.taskCatalogItem.findUnique({
      where: { id: taskCatalogId },
      include: this.taskCatalogInclude(),
    });

    if (!task) {
      throw new NotFoundException("Katalogus feladat nem talalhato.");
    }

    return task;
  }

  async createTaskCatalog(_currentUser: AuthenticatedUser, input: CreateTaskCatalogDto) {
    await this.assertSongExistsIfProvided(input.defaultSongId);
    await this.assertEquipmentIdsExist(input.equipmentIds);

    return this.prisma.taskCatalogItem.create({
      data: {
        ...buildTaskCatalogCreateData(input),
        mediaLinks: {
          create: buildTaskCatalogMediaLinkCreates(input.mediaLinks),
        },
        equipmentLinks: {
          create: buildTaskCatalogEquipmentLinkCreates(input.equipmentIds),
        },
        difficultyLevels: {
          create: buildTaskCatalogDifficultyLevelCreates(input.difficultyLevels),
        },
      },
      include: this.taskCatalogInclude(),
    });
  }

  async updateTaskCatalog(
    currentUser: AuthenticatedUser,
    taskCatalogId: string,
    input: UpdateTaskCatalogDto,
  ) {
    await this.getTaskCatalogDetail(currentUser, taskCatalogId);
    await this.assertSongExistsIfProvided(input.defaultSongId);
    await this.assertEquipmentIdsExist(input.equipmentIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.taskCatalogItem.update({
        where: { id: taskCatalogId },
        data: buildTaskCatalogUpdateScalarData(input),
      });

      if (input.mediaLinks) {
        await tx.taskCatalogMediaLink.deleteMany({
          where: { taskCatalogItemId: taskCatalogId },
        });
        await tx.taskCatalogItem.update({
          where: { id: taskCatalogId },
          data: {
            mediaLinks: {
              create: buildTaskCatalogMediaLinkCreates(input.mediaLinks),
            },
          },
        });
      }

      if (input.equipmentIds) {
        await tx.taskCatalogEquipment.deleteMany({
          where: { taskCatalogItemId: taskCatalogId },
        });
        await tx.taskCatalogItem.update({
          where: { id: taskCatalogId },
          data: {
            equipmentLinks: {
              create: buildTaskCatalogEquipmentLinkCreates(input.equipmentIds),
            },
          },
        });
      }

      if (input.difficultyLevels) {
        await tx.taskCatalogDifficultyLevel.deleteMany({
          where: { taskCatalogItemId: taskCatalogId },
        });
        await tx.taskCatalogItem.update({
          where: { id: taskCatalogId },
          data: {
            difficultyLevels: {
              create: buildTaskCatalogDifficultyLevelCreates(input.difficultyLevels),
            },
          },
        });
      }
    });

    return this.getTaskCatalogDetail(currentUser, taskCatalogId);
  }

  async deleteTaskCatalog(currentUser: AuthenticatedUser, taskCatalogId: string) {
    await this.getTaskCatalogDetail(currentUser, taskCatalogId);
    await this.prisma.taskCatalogItem.delete({ where: { id: taskCatalogId } });
    return { success: true };
  }

  async listSongCatalog(_currentUser: AuthenticatedUser) {
    return this.prisma.songCatalogItem.findMany({
      orderBy: [{ isActive: "desc" }, { title: "asc" }],
      include: {
        audioMedia: true,
        videoMedia: true,
      },
    });
  }

  async getSongCatalogDetail(_currentUser: AuthenticatedUser, songId: string) {
    const song = await this.prisma.songCatalogItem.findUnique({
      where: { id: songId },
      include: {
        audioMedia: true,
        videoMedia: true,
      },
    });

    if (!song) {
      throw new NotFoundException("Dal vagy mondoka nem talalhato.");
    }

    return song;
  }

  async createSongCatalog(_currentUser: AuthenticatedUser, input: CreateSongCatalogDto) {
    return this.prisma.songCatalogItem.create({
      data: {
        title: input.title,
        lyrics: input.lyrics,
        notes: input.notes,
        isActive: input.isActive ?? true,
        audioMedia: buildSongAudioMediaCreateRelation(input.audioExternalUrl),
        videoMedia: buildSongVideoMediaCreateRelation(input.videoExternalUrl),
      },
      include: {
        audioMedia: true,
        videoMedia: true,
      },
    });
  }

  async updateSongCatalog(_currentUser: AuthenticatedUser, songId: string, input: UpdateSongCatalogDto) {
    await this.getSongCatalogDetail(_currentUser, songId);

    return this.prisma.songCatalogItem.update({
      where: { id: songId },
      data: {
        title: input.title,
        lyrics: input.lyrics,
        notes: input.notes,
        isActive: input.isActive,
        audioMedia: buildSongAudioMediaUpdateRelation(input.audioExternalUrl),
        videoMedia: buildSongVideoMediaUpdateRelation(input.videoExternalUrl),
      },
      include: {
        audioMedia: true,
        videoMedia: true,
      },
    });
  }

  async deleteSongCatalog(currentUser: AuthenticatedUser, songId: string) {
    await this.getSongCatalogDetail(currentUser, songId);
    await this.prisma.songCatalogItem.delete({ where: { id: songId } });
    return { success: true };
  }

  async listEquipmentCatalog(_currentUser: AuthenticatedUser) {
    return this.prisma.equipmentCatalogItem.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        iconMedia: true,
        _count: {
          select: {
            taskLinks: true,
          },
        },
      },
    });
  }

  async getEquipmentCatalogDetail(_currentUser: AuthenticatedUser, equipmentId: string) {
    const equipment = await this.prisma.equipmentCatalogItem.findUnique({
      where: { id: equipmentId },
      include: {
        iconMedia: true,
        _count: {
          select: {
            taskLinks: true,
          },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException("Segedeszkoz nem talalhato.");
    }

    return equipment;
  }

  async createEquipmentCatalog(_currentUser: AuthenticatedUser, input: CreateEquipmentCatalogDto) {
    return this.prisma.equipmentCatalogItem.create({
      data: {
        name: input.name,
        description: input.description,
        isActive: input.isActive ?? true,
        iconMedia: buildEquipmentIconMediaCreateRelation(input.iconExternalUrl),
      },
      include: {
        iconMedia: true,
      },
    });
  }

  async updateEquipmentCatalog(
    currentUser: AuthenticatedUser,
    equipmentId: string,
    input: UpdateEquipmentCatalogDto,
  ) {
    await this.getEquipmentCatalogDetail(currentUser, equipmentId);

    return this.prisma.equipmentCatalogItem.update({
      where: { id: equipmentId },
      data: {
        name: input.name,
        description: input.description,
        isActive: input.isActive,
        iconMedia: buildEquipmentIconMediaUpdateRelation(input.iconExternalUrl),
      },
      include: {
        iconMedia: true,
      },
    });
  }

  async deleteEquipmentCatalog(currentUser: AuthenticatedUser, equipmentId: string) {
    await this.getEquipmentCatalogDetail(currentUser, equipmentId);
    await this.prisma.equipmentCatalogItem.delete({ where: { id: equipmentId } });
    return { success: true };
  }

  private taskCatalogInclude() {
    return {
      defaultSong: {
        include: {
          audioMedia: true,
          videoMedia: true,
        },
      },
      mediaLinks: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          mediaAsset: true,
        },
      },
      equipmentLinks: {
        include: {
          equipmentCatalogItem: {
            include: {
              iconMedia: true,
            },
          },
        },
      },
      difficultyLevels: {
        orderBy: { sortOrder: "asc" as const },
      },
      _count: {
        select: {
          routineTasks: true,
        },
      },
    };
  }

  private async assertSongExistsIfProvided(songId?: string) {
    if (!songId) {
      return;
    }

    const song = await this.prisma.songCatalogItem.findUnique({
      where: { id: songId },
      select: { id: true },
    });

    if (!song) {
      throw new NotFoundException("A megadott dal vagy mondoka nem talalhato.");
    }
  }

  private async assertEquipmentIdsExist(equipmentIds?: string[]) {
    if (!equipmentIds?.length) {
      return;
    }

    const count = await this.prisma.equipmentCatalogItem.count({
      where: {
        id: {
          in: equipmentIds,
        },
      },
    });

    if (count !== new Set(equipmentIds).size) {
      throw new NotFoundException("Az egyik megadott segedeszkoz nem talalhato.");
    }
  }
}
