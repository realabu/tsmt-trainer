import { Injectable } from "@nestjs/common";
import { BadgeTriggerType, SessionStatus } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { buildBadgeAwardIdentifiers } from "./domain/badge-award-identifiers";
import { buildBadgeEvaluationFacts } from "./domain/badge-evaluation-facts";
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
  endOfWeek,
  startOfWeek,
} from "./domain/session-week-boundaries";
import {
  isPeriodTargetMet,
  isWeeklyGoalMet,
} from "./domain/weekly-goal-eligibility";
import {
  buildWeeklyGoalSummaries,
  getConsecutiveWeeklyGoalStreakFromSummaries,
} from "./domain/weekly-goal-streak";

@Injectable()
export class SessionBadgeAwardService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateBadges(
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
    const facts = buildBadgeEvaluationFacts({
      completedSessionsCount,
      completedRoutineSessionsCount,
      distinctCompletedRoutineCount,
      completedTaskCount,
      previousBestTotalSeconds: previousBest?.totalSeconds,
      routine: routine
        ? {
            id: routine.id,
            periods: routine.periods,
          }
        : null,
    });

    for (const badge of badgeDefinitions) {
      if (
        badge.triggerType === BadgeTriggerType.FIRST_SESSION &&
        shouldAwardFirstSessionBadge(facts.completedSessionsCount)
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
        if (shouldAwardTotalSessionCountBadge(facts.completedSessionsCount, threshold)) {
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
        shouldAwardRoutineRecordBadge(totalSeconds, facts.previousBestTotalSeconds)
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
        const matchingPeriod = facts.routine?.periods.find(
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
        if (
          shouldAwardRoutineSessionCountBadge(facts.completedRoutineSessionsCount, threshold)
        ) {
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
        if (
          shouldAwardDistinctRoutineCountBadge(facts.distinctCompletedRoutineCount, threshold)
        ) {
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

      if (badge.triggerType === BadgeTriggerType.CONSECUTIVE_WEEKS_COMPLETED && facts.routine) {
        const threshold = getBadgeTriggerThreshold(
          badge.triggerConfig as { threshold?: number } | null,
        );
        if (threshold > 0) {
          const streak = await this.getConsecutiveWeeklyGoalStreak(
            childId,
            facts.routine,
            completedAt,
          );
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

      if (badge.triggerType === BadgeTriggerType.PERIOD_TARGET_COMPLETED && facts.routine) {
        const matchingPeriod = facts.routine.periods.find(
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
        if (shouldAwardTaskCompletionCountBadge(facts.completedTaskCount, threshold)) {
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
