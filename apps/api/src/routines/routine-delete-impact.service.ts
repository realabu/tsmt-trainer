import { Injectable, NotFoundException } from "@nestjs/common";
import { SessionStatus } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";
import {
  buildRoutineDeleteImpact,
  buildRoutinePeriodDeleteImpact,
  buildRoutineTaskDeleteImpact,
} from "./domain/routine-delete-impact";

@Injectable()
export class RoutineDeleteImpactService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeleteImpact(currentUser: AuthenticatedUser, routineId: string) {
    const routine = await this.prisma.routine.findFirst({
      where: {
        id: routineId,
        child: {
          ownerId: currentUser.sub,
        },
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        periods: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!routine) {
      throw new NotFoundException("Feladatsor nem talalhato.");
    }

    const periodIds = routine.periods.map((period) => period.id);

    const [
      taskCount,
      taskMediaLinkCount,
      periodCount,
      sessionCount,
      sessionTaskTimingCount,
      trainerAssignmentCount,
      detachedBadgeAwardCount,
    ] = await Promise.all([
      this.prisma.routineTask.count({
        where: { routineId },
      }),
      this.prisma.taskMediaLink.count({
        where: {
          task: {
            routineId,
          },
        },
      }),
      this.prisma.routinePeriod.count({
        where: { routineId },
      }),
      this.prisma.session.count({
        where: { routineId },
      }),
      this.prisma.sessionTaskTiming.count({
        where: {
          session: {
            routineId,
          },
        },
      }),
      this.prisma.routineAssignment.count({
        where: { routineId },
      }),
      this.prisma.badgeAward.count({
        where: {
          OR: [
            { routineId },
            ...(periodIds.length ? [{ periodId: { in: periodIds } }] : []),
          ],
        },
      }),
    ]);

    return buildRoutineDeleteImpact({
      routineId: routine.id,
      routineName: routine.name,
      childFirstName: routine.child.firstName,
      childLastName: routine.child.lastName,
      taskCount,
      taskMediaLinkCount,
      periodCount,
      sessionCount,
      sessionTaskTimingCount,
      trainerAssignmentCount,
      detachedBadgeAwardCount,
    });
  }

  async getTaskDeleteImpact(currentUser: AuthenticatedUser, taskId: string) {
    const task = await this.prisma.routineTask.findFirst({
      where: {
        id: taskId,
        routine: {
          child: {
            ownerId: currentUser.sub,
          },
        },
      },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
            child: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Feladat nem talalhato.");
    }

    const [taskMediaLinkCount, sessionTimingCount] = await Promise.all([
      this.prisma.taskMediaLink.count({
        where: {
          taskId,
        },
      }),
      this.prisma.sessionTaskTiming.count({
        where: {
          taskId,
        },
      }),
    ]);

    return buildRoutineTaskDeleteImpact({
      taskId: task.id,
      taskTitle: task.title,
      routineName: task.routine.name,
      childFirstName: task.routine.child.firstName,
      childLastName: task.routine.child.lastName,
      taskMediaLinkCount,
      sessionTimingCount,
    });
  }

  async getPeriodDeleteImpact(currentUser: AuthenticatedUser, periodId: string) {
    const period = await this.prisma.routinePeriod.findFirst({
      where: {
        id: periodId,
        routine: {
          child: {
            ownerId: currentUser.sub,
          },
        },
      },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
            child: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException("Idoszak nem talalhato.");
    }

    const [detachedBadgeAwardCount, completedSessionCount] = await Promise.all([
      this.prisma.badgeAward.count({
        where: { periodId },
      }),
      this.prisma.session.count({
        where: {
          routineId: period.routineId,
          status: SessionStatus.COMPLETED,
          completedAt: {
            gte: period.startsOn,
            lte: period.endsOn,
          },
        },
      }),
    ]);

    return buildRoutinePeriodDeleteImpact({
      periodId: period.id,
      periodName: period.name,
      routineName: period.routine.name,
      childFirstName: period.routine.child.firstName,
      childLastName: period.routine.child.lastName,
      detachedBadgeAwardCount,
      completedSessionCount,
    });
  }
}
