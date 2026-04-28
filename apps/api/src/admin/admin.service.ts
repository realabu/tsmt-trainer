import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MediaKind, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import type { AuthenticatedUser } from "../auth/auth.types";
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
  CreateEquipmentCatalogDto,
  CreateSongCatalogDto,
  CreateTaskCatalogDto,
  UpdateEquipmentCatalogDto,
  UpdateSongCatalogDto,
  UpdateTaskCatalogDto,
  UpdateUserDto,
} from "./dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);

    return this.prisma.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            ownedChildren: true,
            trainerAssignments: true,
          },
        },
      },
    });
  }

  async updateUser(currentUser: AuthenticatedUser, userId: string, input: UpdateUserDto) {
    this.assertAdmin(currentUser);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException("Felhasznalo nem talalhato.");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: input.email?.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role as UserRole | undefined,
        passwordHash: input.password ? await hash(input.password, 12) : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  async deleteUser(currentUser: AuthenticatedUser, userId: string) {
    this.assertAdmin(currentUser);

    if (currentUser.sub === userId) {
      throw new ForbiddenException("Az admin sajat magat nem torolheti.");
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  async listParents(currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);

    return this.prisma.user.findMany({
      where: {
        role: UserRole.PARENT,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        ownedChildren: {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async listChildrenByParent(currentUser: AuthenticatedUser, parentId: string) {
    this.assertAdmin(currentUser);

    return this.prisma.child.findMany({
      where: {
        ownerId: parentId,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        routines: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async listRoutines(currentUser: AuthenticatedUser, parentId?: string, childId?: string) {
    this.assertAdmin(currentUser);

    return this.prisma.routine.findMany({
      where: {
        ...(childId ? { childId } : {}),
        ...(parentId ? { child: { ownerId: parentId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        child: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        tasks: {
          orderBy: { sortOrder: "asc" },
        },
        periods: {
          orderBy: { startsOn: "asc" },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });
  }

  async getRoutineDetail(currentUser: AuthenticatedUser, routineId: string) {
    this.assertAdmin(currentUser);

    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        child: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        tasks: {
          orderBy: { sortOrder: "asc" },
          include: {
            mediaLinks: {
              orderBy: { sortOrder: "asc" },
              include: {
                mediaAsset: true,
              },
            },
          },
        },
        periods: {
          orderBy: { startsOn: "asc" },
        },
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        trainerAssignments: {
          where: { revokedAt: null },
          include: {
            trainer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!routine) {
      throw new NotFoundException("Feladatsor nem talalhato.");
    }

    return routine;
  }

  async listSessions(
    currentUser: AuthenticatedUser,
    parentId?: string,
    childId?: string,
    routineId?: string,
  ) {
    this.assertAdmin(currentUser);

    return this.prisma.session.findMany({
      where: {
        ...(childId ? { childId } : {}),
        ...(routineId ? { routineId } : {}),
        ...(parentId ? { child: { ownerId: parentId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        child: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        routine: {
          select: {
            id: true,
            name: true,
          },
        },
        taskTimings: {
          orderBy: { sortOrder: "asc" },
        },
      },
      take: 50,
    });
  }

  async getSessionDetail(currentUser: AuthenticatedUser, sessionId: string) {
    this.assertAdmin(currentUser);

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        child: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        routine: {
          include: {
            tasks: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        taskTimings: {
          orderBy: { sortOrder: "asc" },
          include: {
            task: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Session nem talalhato.");
    }

    return session;
  }

  async listTaskCatalog(currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);

    return this.prisma.taskCatalogItem.findMany({
      orderBy: [{ isActive: "desc" }, { title: "asc" }],
      include: this.taskCatalogInclude(),
    });
  }

  async getTaskCatalogDetail(currentUser: AuthenticatedUser, taskCatalogId: string) {
    this.assertAdmin(currentUser);

    const task = await this.prisma.taskCatalogItem.findUnique({
      where: { id: taskCatalogId },
      include: this.taskCatalogInclude(),
    });

    if (!task) {
      throw new NotFoundException("Katalogus feladat nem talalhato.");
    }

    return task;
  }

  async createTaskCatalog(currentUser: AuthenticatedUser, input: CreateTaskCatalogDto) {
    this.assertAdmin(currentUser);

    await this.assertSongExistsIfProvided(input.defaultSongId);
    await this.assertEquipmentIdsExist(input.equipmentIds);

    return this.prisma.taskCatalogItem.create({
      data: {
        title: input.title,
        summary: input.summary,
        instructions: input.instructions,
        focusPoints: input.focusPoints,
        demoVideoUrl: input.demoVideoUrl,
        defaultSongId: input.defaultSongId,
        isActive: input.isActive ?? true,
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
    this.assertAdmin(currentUser);
    await this.getTaskCatalogDetail(currentUser, taskCatalogId);
    await this.assertSongExistsIfProvided(input.defaultSongId);
    await this.assertEquipmentIdsExist(input.equipmentIds);

    await this.prisma.taskCatalogItem.update({
      where: { id: taskCatalogId },
      data: {
        title: input.title,
        summary: input.summary,
        instructions: input.instructions,
        focusPoints: input.focusPoints,
        demoVideoUrl: input.demoVideoUrl,
        defaultSongId:
          input.defaultSongId === undefined ? undefined : input.defaultSongId || null,
        isActive: input.isActive,
      },
    });

    if (input.mediaLinks) {
      await this.prisma.taskCatalogMediaLink.deleteMany({
        where: { taskCatalogItemId: taskCatalogId },
      });
      await this.prisma.taskCatalogItem.update({
        where: { id: taskCatalogId },
        data: {
          mediaLinks: {
            create: buildTaskCatalogMediaLinkCreates(input.mediaLinks),
          },
        },
      });
    }

    if (input.equipmentIds) {
      await this.prisma.taskCatalogEquipment.deleteMany({
        where: { taskCatalogItemId: taskCatalogId },
      });
      await this.prisma.taskCatalogItem.update({
        where: { id: taskCatalogId },
        data: {
          equipmentLinks: {
            create: buildTaskCatalogEquipmentLinkCreates(input.equipmentIds),
          },
        },
      });
    }

    if (input.difficultyLevels) {
      await this.prisma.taskCatalogDifficultyLevel.deleteMany({
        where: { taskCatalogItemId: taskCatalogId },
      });
      await this.prisma.taskCatalogItem.update({
        where: { id: taskCatalogId },
        data: {
          difficultyLevels: {
            create: buildTaskCatalogDifficultyLevelCreates(input.difficultyLevels),
          },
        },
      });
    }

    return this.getTaskCatalogDetail(currentUser, taskCatalogId);
  }

  async deleteTaskCatalog(currentUser: AuthenticatedUser, taskCatalogId: string) {
    this.assertAdmin(currentUser);
    await this.getTaskCatalogDetail(currentUser, taskCatalogId);
    await this.prisma.taskCatalogItem.delete({ where: { id: taskCatalogId } });
    return { success: true };
  }

  async listSongCatalog(currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);

    return this.prisma.songCatalogItem.findMany({
      orderBy: [{ isActive: "desc" }, { title: "asc" }],
      include: {
        audioMedia: true,
        videoMedia: true,
      },
    });
  }

  async getSongCatalogDetail(currentUser: AuthenticatedUser, songId: string) {
    this.assertAdmin(currentUser);

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

  async createSongCatalog(currentUser: AuthenticatedUser, input: CreateSongCatalogDto) {
    this.assertAdmin(currentUser);

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

  async updateSongCatalog(currentUser: AuthenticatedUser, songId: string, input: UpdateSongCatalogDto) {
    this.assertAdmin(currentUser);
    await this.getSongCatalogDetail(currentUser, songId);

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
    this.assertAdmin(currentUser);
    await this.getSongCatalogDetail(currentUser, songId);
    await this.prisma.songCatalogItem.delete({ where: { id: songId } });
    return { success: true };
  }

  async listEquipmentCatalog(currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);

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

  async getEquipmentCatalogDetail(currentUser: AuthenticatedUser, equipmentId: string) {
    this.assertAdmin(currentUser);

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

  async createEquipmentCatalog(currentUser: AuthenticatedUser, input: CreateEquipmentCatalogDto) {
    this.assertAdmin(currentUser);

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
    this.assertAdmin(currentUser);
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
    this.assertAdmin(currentUser);
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

  private assertAdmin(currentUser: AuthenticatedUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Ez a muvelet admin szerepkort igenyel.");
    }
  }
}
