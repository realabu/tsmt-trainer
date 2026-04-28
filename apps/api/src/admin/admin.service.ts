import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";
import { AdminCatalogService } from "./admin-catalog.service";
import { AdminUserService } from "./admin-user.service";
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminCatalogService: AdminCatalogService,
    private readonly adminUserService: AdminUserService,
  ) {}

  async listUsers(currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);
    return this.adminUserService.listUsers(currentUser);
  }

  async updateUser(currentUser: AuthenticatedUser, userId: string, input: UpdateUserDto) {
    this.assertAdmin(currentUser);
    return this.adminUserService.updateUser(currentUser, userId, input);
  }

  async deleteUser(currentUser: AuthenticatedUser, userId: string) {
    this.assertAdmin(currentUser);
    return this.adminUserService.deleteUser(currentUser, userId);
  }

  async listParents(currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);
    return this.adminUserService.listParents(currentUser);
  }

  async listChildrenByParent(currentUser: AuthenticatedUser, parentId: string) {
    this.assertAdmin(currentUser);
    return this.adminUserService.listChildrenByParent(currentUser, parentId);
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
    return this.adminCatalogService.listTaskCatalog(currentUser);
  }

  async getTaskCatalogDetail(currentUser: AuthenticatedUser, taskCatalogId: string) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.getTaskCatalogDetail(currentUser, taskCatalogId);
  }

  async createTaskCatalog(currentUser: AuthenticatedUser, input: CreateTaskCatalogDto) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.createTaskCatalog(currentUser, input);
  }

  async updateTaskCatalog(
    currentUser: AuthenticatedUser,
    taskCatalogId: string,
    input: UpdateTaskCatalogDto,
  ) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.updateTaskCatalog(currentUser, taskCatalogId, input);
  }

  async deleteTaskCatalog(currentUser: AuthenticatedUser, taskCatalogId: string) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.deleteTaskCatalog(currentUser, taskCatalogId);
  }

  async listSongCatalog(currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.listSongCatalog(currentUser);
  }

  async getSongCatalogDetail(currentUser: AuthenticatedUser, songId: string) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.getSongCatalogDetail(currentUser, songId);
  }

  async createSongCatalog(currentUser: AuthenticatedUser, input: CreateSongCatalogDto) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.createSongCatalog(currentUser, input);
  }

  async updateSongCatalog(currentUser: AuthenticatedUser, songId: string, input: UpdateSongCatalogDto) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.updateSongCatalog(currentUser, songId, input);
  }

  async deleteSongCatalog(currentUser: AuthenticatedUser, songId: string) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.deleteSongCatalog(currentUser, songId);
  }

  async listEquipmentCatalog(currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.listEquipmentCatalog(currentUser);
  }

  async getEquipmentCatalogDetail(currentUser: AuthenticatedUser, equipmentId: string) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.getEquipmentCatalogDetail(currentUser, equipmentId);
  }

  async createEquipmentCatalog(currentUser: AuthenticatedUser, input: CreateEquipmentCatalogDto) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.createEquipmentCatalog(currentUser, input);
  }

  async updateEquipmentCatalog(
    currentUser: AuthenticatedUser,
    equipmentId: string,
    input: UpdateEquipmentCatalogDto,
  ) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.updateEquipmentCatalog(currentUser, equipmentId, input);
  }

  async deleteEquipmentCatalog(currentUser: AuthenticatedUser, equipmentId: string) {
    this.assertAdmin(currentUser);
    return this.adminCatalogService.deleteEquipmentCatalog(currentUser, equipmentId);
  }

  private assertAdmin(currentUser: AuthenticatedUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Ez a muvelet admin szerepkort igenyel.");
    }
  }
}
