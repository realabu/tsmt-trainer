import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { TrainerAssignmentStatus, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";
import { CreateTrainerAssignmentDto } from "./dto";

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  async createAssignment(currentUser: AuthenticatedUser, input: CreateTrainerAssignmentDto) {
    if (currentUser.role !== UserRole.PARENT && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Csak szulo vagy admin rendelhet trainert.");
    }

    const routine = await this.prisma.routine.findFirst({
      where: {
        id: input.routineId,
        childId: input.childId,
        child: {
          ownerId: currentUser.sub,
        },
      },
      select: {
        id: true,
        childId: true,
      },
    });

    if (!routine) {
      throw new NotFoundException("A gyerek vagy a rutin nem talalhato a fiokodon.");
    }

    const trainer = await this.prisma.user.findUnique({
      where: {
        email: input.trainerEmail.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!trainer) {
      throw new NotFoundException("Nincs ilyen trainer emaillel felhasznalo.");
    }

    if (trainer.role !== UserRole.TRAINER && trainer.role !== UserRole.ADMIN) {
      throw new BadRequestException("A megadott felhasznalo nem trainer szerepkoru.");
    }

    const existing = await this.prisma.routineAssignment.findFirst({
      where: {
        childId: input.childId,
        routineId: input.routineId,
        trainerId: trainer.id,
        revokedAt: null,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.routineAssignment.create({
      data: {
        childId: input.childId,
        routineId: input.routineId,
        trainerId: trainer.id,
        status:
          input.status === "ACTIVE"
            ? TrainerAssignmentStatus.ACTIVE
            : TrainerAssignmentStatus.PENDING,
      },
      include: {
        trainer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
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
          },
        },
      },
    });
  }

  async listMyAssignments(currentUser: AuthenticatedUser) {
    if (currentUser.role !== UserRole.TRAINER && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Ez a nezet trainer szerepkort igenyel.");
    }

    return this.prisma.routineAssignment.findMany({
      where: {
        trainerId: currentUser.sub,
        revokedAt: null,
      },
      orderBy: {
        assignedAt: "desc",
      },
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
            periods: {
              orderBy: { startsOn: "asc" },
            },
            sessions: {
              orderBy: { createdAt: "desc" },
              take: 10,
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
            trainerAssignments: {
              where: {
                revokedAt: null,
              },
              include: {
                trainer: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
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
              },
            },
          },
        },
      },
    });
  }

  async listOwnedAssignments(currentUser: AuthenticatedUser, childId?: string, routineId?: string) {
    if (currentUser.role !== UserRole.PARENT && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Ez a nezet szuloi vagy admin szerepkort igenyel.");
    }

    return this.prisma.routineAssignment.findMany({
      where: {
        ...(childId ? { childId } : {}),
        ...(routineId ? { routineId } : {}),
        revokedAt: null,
        child: {
          ownerId: currentUser.sub,
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
      include: {
        trainer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        routine: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getTrainerRoutineOverview(currentUser: AuthenticatedUser, assignmentId: string) {
    if (currentUser.role !== UserRole.TRAINER && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Ez a nezet trainer szerepkort igenyel.");
    }

    const assignment = await this.prisma.routineAssignment.findFirst({
      where: {
        id: assignmentId,
        trainerId: currentUser.sub,
        revokedAt: null,
      },
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
            badgeAwards: {
              orderBy: { awardedAt: "desc" },
              take: 12,
              include: {
                badgeDefinition: true,
              },
            },
          },
        },
        routine: {
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
            periods: {
              orderBy: { startsOn: "asc" },
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
            sessions: {
              orderBy: { createdAt: "desc" },
              take: 20,
              include: {
                taskTimings: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
            trainerAssignments: {
              where: {
                revokedAt: null,
              },
              include: {
                trainer: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
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
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException("Nem talalhato ilyen trainer hozzarendeles.");
    }

    return assignment;
  }

  async revokeAssignment(currentUser: AuthenticatedUser, assignmentId: string) {
    if (currentUser.role !== UserRole.PARENT && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Csak szulo vagy admin szuntethet meg megosztast.");
    }

    const assignment = await this.prisma.routineAssignment.findFirst({
      where: {
        id: assignmentId,
        revokedAt: null,
        child: {
          ownerId: currentUser.sub,
        },
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException("Nem talalhato ilyen aktiv trainer megosztas.");
    }

    await this.prisma.routineAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        revokedAt: new Date(),
        status: TrainerAssignmentStatus.REVOKED,
      },
    });

    return { success: true };
  }
}
