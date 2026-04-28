import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class AdminActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoutines(_currentUser: AuthenticatedUser, parentId?: string, childId?: string) {
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

  async getRoutineDetail(_currentUser: AuthenticatedUser, routineId: string) {
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
    _currentUser: AuthenticatedUser,
    parentId?: string,
    childId?: string,
    routineId?: string,
  ) {
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

  async getSessionDetail(_currentUser: AuthenticatedUser, sessionId: string) {
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
}
