import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";
import { UpdateUserDto } from "./dto";

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

  private assertAdmin(currentUser: AuthenticatedUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Ez a muvelet admin szerepkort igenyel.");
    }
  }
}
