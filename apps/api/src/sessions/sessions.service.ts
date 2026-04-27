import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BadgeTriggerType, SessionStatus } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";
import { buildBadgeAwardIdentifiers } from "./domain/badge-award-identifiers";
import { getBadgeTriggerThreshold } from "./domain/badge-trigger-config";
import {
  shouldAwardDistinctRoutineCountBadge,
  shouldAwardFirstSessionBadge,
  shouldAwardRoutineRecordBadge,
  shouldAwardRoutineSessionCountBadge,
  shouldAwardTaskCompletionCountBadge,
  shouldAwardTotalSessionCountBadge,
} from "./domain/badge-trigger-decisions";
import {
  isPeriodTargetMet,
  isWeeklyGoalMet,
} from "./domain/weekly-goal-eligibility";
import {
  endOfWeek,
  startOfWeek,
} from "./domain/session-week-boundaries";
import {
  buildWeeklyGoalSummaries,
  getConsecutiveWeeklyGoalStreakFromSummaries,
} from "./domain/weekly-goal-streak";
import { CancelSessionDto, CompleteTaskDto, FinishSessionDto } from "./dto";

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(currentUser: AuthenticatedUser, routineId: string) {
    const routine = await this.prisma.routine.findFirst({
      where: {
        id: routineId,
        child: {
          ownerId: currentUser.sub,
        },
      },
      include: {
        child: true,
        tasks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!routine) {
      throw new NotFoundException("Feladatsor nem talalhato.");
    }

    if (routine.tasks.length === 0) {
      throw new BadRequestException("A feladatsor nem tartalmaz feladatot.");
    }

    return this.prisma.session.create({
      data: {
        childId: routine.childId,
        routineId: routine.id,
        status: SessionStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        routine: {
          include: {
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
          },
        },
        taskTimings: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  async getById(currentUser: AuthenticatedUser, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        child: {
          ownerId: currentUser.sub,
        },
      },
      include: {
        routine: {
          include: {
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
              where: {
                status: SessionStatus.COMPLETED,
              },
              orderBy: {
                totalSeconds: "asc",
              },
              take: 3,
              select: {
                id: true,
                totalSeconds: true,
                completedAt: true,
              },
            },
          },
        },
        taskTimings: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Session nem talalhato.");
    }

    return session;
  }

  async listByRoutine(currentUser: AuthenticatedUser, routineId?: string, childId?: string) {
    return this.prisma.session.findMany({
      where: {
        ...(routineId ? { routineId } : {}),
        ...(childId ? { childId } : {}),
        child: {
          ownerId: currentUser.sub,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        taskTimings: {
          orderBy: { sortOrder: "asc" },
        },
        routine: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 25,
    });
  }

  async completeTask(currentUser: AuthenticatedUser, sessionId: string, input: CompleteTaskDto) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        status: SessionStatus.IN_PROGRESS,
        child: {
          ownerId: currentUser.sub,
        },
      },
      include: {
        routine: {
          include: {
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
          },
        },
        taskTimings: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Aktiv session nem talalhato.");
    }

    const task = session.routine.tasks.find((item) => item.id === input.taskId);
    if (!task) {
      throw new BadRequestException("A feladat nem resze a feladatsornak.");
    }

    const alreadyCompleted = session.taskTimings.some((item) => item.taskId === input.taskId);
    if (alreadyCompleted) {
      throw new BadRequestException("Ez a feladat mar rogzitve lett ebben a sessionben.");
    }

    const nextExpectedOrder = session.taskTimings.length + 1;
    if (task.sortOrder !== nextExpectedOrder) {
      throw new BadRequestException("A feladatok jelenleg csak eredeti sorrendben teljesithetok.");
    }

    await this.prisma.sessionTaskTiming.create({
      data: {
        sessionId: session.id,
        taskId: task.id,
        sortOrder: task.sortOrder,
        secondsSpent: input.secondsSpent,
        startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
        completedAt: input.completedAt ? new Date(input.completedAt) : new Date(),
      },
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        completedTaskCount: {
          increment: 1,
        },
      },
    });

    return this.getById(currentUser, session.id);
  }

  async finish(currentUser: AuthenticatedUser, sessionId: string, input: FinishSessionDto) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        status: SessionStatus.IN_PROGRESS,
        child: {
          ownerId: currentUser.sub,
        },
      },
      include: {
        routine: {
          include: {
            tasks: true,
          },
        },
        taskTimings: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Aktiv session nem talalhato.");
    }

    const completedAt = input.completedAt ? new Date(input.completedAt) : new Date();
    const startedAt = session.startedAt ?? session.createdAt;
    const totalSeconds = Math.max(
      1,
      Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000),
    );

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt,
        totalSeconds,
        notes: input.notes,
      },
    });

    await this.evaluateBadges(session.childId, session.routineId, totalSeconds, completedAt);

    return this.getById(currentUser, session.id);
  }

  async cancel(currentUser: AuthenticatedUser, sessionId: string, input: CancelSessionDto) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        status: SessionStatus.IN_PROGRESS,
        child: {
          ownerId: currentUser.sub,
        },
      },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException("Aktiv session nem talalhato.");
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.CANCELED,
        completedAt: new Date(),
        notes: input.notes,
      },
    });

    return { success: true };
  }

  private async evaluateBadges(
    childId: string,
    routineId: string,
    totalSeconds: number,
    completedAt: Date,
  ) {
    const badgeDefinitions = await this.prisma.badgeDefinition.findMany({
      where: {
        isActive: true,
      },
    });

    const completedSessionsCount = await this.prisma.session.count({
      where: {
        childId,
        status: SessionStatus.COMPLETED,
      },
    });
    const completedRoutineSessionsCount = await this.prisma.session.count({
      where: {
        childId,
        routineId,
        status: SessionStatus.COMPLETED,
      },
    });
    const distinctCompletedRoutineCount = (
      await this.prisma.session.findMany({
        where: {
          childId,
          status: SessionStatus.COMPLETED,
        },
        distinct: ["routineId"],
        select: {
          routineId: true,
        },
      })
    ).length;
    const completedTaskCount = await this.prisma.sessionTaskTiming.count({
      where: {
        session: {
          childId,
          status: SessionStatus.COMPLETED,
        },
      },
    });

    const previousBest = await this.prisma.session.findFirst({
      where: {
        childId,
        routineId,
        status: SessionStatus.COMPLETED,
        completedAt: {
          lt: completedAt,
        },
      },
      orderBy: {
        totalSeconds: "asc",
      },
      select: {
        totalSeconds: true,
      },
    });

    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        periods: true,
      },
    });

    for (const badge of badgeDefinitions) {
      if (
        badge.triggerType === BadgeTriggerType.FIRST_SESSION &&
        shouldAwardFirstSessionBadge(completedSessionsCount)
      ) {
        const identifiers = buildBadgeAwardIdentifiers({ type: "first-session" });
        await this.createBadgeAwardIfMissing({
          childId,
          routineId,
          badgeDefinitionId: badge.id,
          contextKey: identifiers.contextKey,
          reason: identifiers.reason,
        });
      }

      if (badge.triggerType === BadgeTriggerType.TOTAL_SESSION_COUNT) {
        const threshold = getBadgeTriggerThreshold(
          badge.triggerConfig as { threshold?: number } | null,
        );
        if (shouldAwardTotalSessionCountBadge(completedSessionsCount, threshold)) {
          const identifiers = buildBadgeAwardIdentifiers({ type: "total-sessions", threshold });
          await this.createBadgeAwardIfMissing({
            childId,
            routineId,
            badgeDefinitionId: badge.id,
            contextKey: identifiers.contextKey,
            reason: identifiers.reason,
          });
        }
      }

      if (
        badge.triggerType === BadgeTriggerType.ROUTINE_RECORD &&
        shouldAwardRoutineRecordBadge(totalSeconds, previousBest?.totalSeconds)
      ) {
        const identifiers = buildBadgeAwardIdentifiers({
          type: "routine-record",
          routineId,
          completedAt,
        });
        await this.createBadgeAwardIfMissing({
          childId,
          routineId,
          badgeDefinitionId: badge.id,
          contextKey: identifiers.contextKey,
          reason: identifiers.reason,
        });
      }

      if (badge.triggerType === BadgeTriggerType.WEEKLY_GOAL_COMPLETED && routine) {
        const matchingPeriod = routine.periods.find(
          (period) => completedAt >= period.startsOn && completedAt <= period.endsOn,
        );

        if (matchingPeriod) {
          const weekStart = startOfWeek(completedAt);
          const weekEnd = endOfWeek(completedAt);
          const completedInWeek = await this.prisma.session.count({
            where: {
              childId,
              routineId,
              status: SessionStatus.COMPLETED,
              completedAt: {
                gte: weekStart,
                lte: weekEnd,
              },
            },
          });

          if (
            isWeeklyGoalMet({
              completedInWeek,
              weekStart,
              weekEnd,
              period: matchingPeriod,
            })
          ) {
            const identifiers = buildBadgeAwardIdentifiers({
              type: "weekly-goal",
              routineId,
              periodId: matchingPeriod.id,
              weekStart,
            });
            await this.createBadgeAwardIfMissing({
              childId,
              routineId,
              periodId: matchingPeriod.id,
              badgeDefinitionId: badge.id,
              contextKey: identifiers.contextKey,
              reason: identifiers.reason,
            });
          }
        }
      }

      if (badge.triggerType === BadgeTriggerType.ROUTINE_SESSION_COUNT) {
        const threshold = getBadgeTriggerThreshold(
          badge.triggerConfig as { threshold?: number } | null,
        );
        if (shouldAwardRoutineSessionCountBadge(completedRoutineSessionsCount, threshold)) {
          const identifiers = buildBadgeAwardIdentifiers({
            type: "routine-sessions",
            routineId,
            threshold,
          });
          await this.createBadgeAwardIfMissing({
            childId,
            routineId,
            badgeDefinitionId: badge.id,
            contextKey: identifiers.contextKey,
            reason: identifiers.reason,
          });
        }
      }

      if (badge.triggerType === BadgeTriggerType.DISTINCT_ROUTINE_COUNT) {
        const threshold = getBadgeTriggerThreshold(
          badge.triggerConfig as { threshold?: number } | null,
        );
        if (shouldAwardDistinctRoutineCountBadge(distinctCompletedRoutineCount, threshold)) {
          const identifiers = buildBadgeAwardIdentifiers({ type: "distinct-routines", threshold });
          await this.createBadgeAwardIfMissing({
            childId,
            routineId,
            badgeDefinitionId: badge.id,
            contextKey: identifiers.contextKey,
            reason: identifiers.reason,
          });
        }
      }

      if (badge.triggerType === BadgeTriggerType.CONSECUTIVE_WEEKS_COMPLETED && routine) {
        const threshold = getBadgeTriggerThreshold(
          badge.triggerConfig as { threshold?: number } | null,
        );
        if (threshold > 0) {
          const streak = await this.getConsecutiveWeeklyGoalStreak(childId, routine, completedAt);
          if (streak >= threshold) {
            const identifiers = buildBadgeAwardIdentifiers({
              type: "weekly-streak",
              routineId,
              threshold,
              completedAt,
            });
            await this.createBadgeAwardIfMissing({
              childId,
              routineId,
              badgeDefinitionId: badge.id,
              contextKey: identifiers.contextKey,
              reason: identifiers.reason,
            });
          }
        }
      }

      if (badge.triggerType === BadgeTriggerType.PERIOD_TARGET_COMPLETED && routine) {
        const matchingPeriod = routine.periods.find(
          (period) => completedAt >= period.startsOn && completedAt <= period.endsOn,
        );

        if (matchingPeriod) {
          const completedInPeriod = await this.prisma.session.count({
            where: {
              childId,
              routineId,
              status: SessionStatus.COMPLETED,
              completedAt: {
                gte: matchingPeriod.startsOn,
                lte: matchingPeriod.endsOn,
              },
            },
          });

          if (
            isPeriodTargetMet({
              completedInPeriod,
              period: matchingPeriod,
            })
          ) {
            const identifiers = buildBadgeAwardIdentifiers({
              type: "period-target",
              routineId,
              periodId: matchingPeriod.id,
            });
            await this.createBadgeAwardIfMissing({
              childId,
              routineId,
              periodId: matchingPeriod.id,
              badgeDefinitionId: badge.id,
              contextKey: identifiers.contextKey,
              reason: identifiers.reason,
            });
          }
        }
      }

      if (badge.triggerType === BadgeTriggerType.TASK_COMPLETION_COUNT) {
        const threshold = getBadgeTriggerThreshold(
          badge.triggerConfig as { threshold?: number } | null,
        );
        if (shouldAwardTaskCompletionCountBadge(completedTaskCount, threshold)) {
          const identifiers = buildBadgeAwardIdentifiers({ type: "task-completions", threshold });
          await this.createBadgeAwardIfMissing({
            childId,
            routineId,
            badgeDefinitionId: badge.id,
            contextKey: identifiers.contextKey,
            reason: identifiers.reason,
          });
        }
      }
    }
  }

  private async createBadgeAwardIfMissing(input: {
    childId: string;
    routineId?: string;
    periodId?: string;
    badgeDefinitionId: string;
    contextKey?: string;
    reason: string;
  }) {
    const existing = await this.prisma.badgeAward.findFirst({
      where: {
        childId: input.childId,
        badgeDefinitionId: input.badgeDefinitionId,
        ...(input.contextKey ? { contextKey: input.contextKey } : { reason: input.reason }),
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.badgeAward.create({
      data: input,
    });
  }

  private async getConsecutiveWeeklyGoalStreak(
    childId: string,
    routine: {
      id: string;
      periods: Array<{
        id: string;
        startsOn: Date;
        endsOn: Date;
        weeklyTargetCount: number;
      }>;
    },
    completedAt: Date,
  ) {
    const periods = [...routine.periods].sort((a, b) => a.startsOn.getTime() - b.startsOn.getTime());
    const completedSessions = await this.prisma.session.findMany({
      where: {
        childId,
        routineId: routine.id,
        status: SessionStatus.COMPLETED,
        completedAt: {
          lte: completedAt,
        },
      },
      select: {
        completedAt: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    });
    const weekSummaries = buildWeeklyGoalSummaries({
      periods,
      completedSessionDates: completedSessions.map((session) => session.completedAt),
      completedAt,
    });

    return getConsecutiveWeeklyGoalStreakFromSummaries(weekSummaries, completedAt);
  }
}
