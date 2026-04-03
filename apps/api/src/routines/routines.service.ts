import { MediaKind, SessionStatus } from "@prisma/client";
import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";
import { CreateRoutineDto, UpdateRoutineDto } from "./dto";

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async listByChild(currentUser: AuthenticatedUser, childId?: string) {
    return this.prisma.routine.findMany({
      where: {
        ...(childId ? { childId } : {}),
        child: {
          ownerId: currentUser.sub,
        },
      },
      orderBy: { createdAt: "desc" },
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

  async create(currentUser: AuthenticatedUser, input: CreateRoutineDto) {
    const child = await this.prisma.child.findFirst({
      where: {
        id: input.childId,
        ownerId: currentUser.sub,
      },
      select: { id: true },
    });

    if (!child) {
      throw new NotFoundException("A gyerek nem talalhato ezen a fiokon.");
    }

    return this.prisma.routine.create({
      data: {
        childId: input.childId,
        name: input.name,
        description: input.description,
        tasks: {
          create: input.tasks.map((task) => ({
            sortOrder: task.sortOrder,
            title: task.title,
            details: task.details,
            repetitionsLabel: task.repetitionsLabel,
            mediaLinks: {
              create: (task.mediaLinks ?? []).map((media, index) => ({
                label: media.label,
                sortOrder: index,
                mediaAsset: {
                  create: {
                    kind: parseMediaKind(media.kind),
                    externalUrl: media.externalUrl,
                  },
                },
              })),
            },
          })),
        },
        periods: {
          create: input.periods.map((period) => ({
            name: period.name,
            startsOn: new Date(period.startsOn),
            endsOn: new Date(period.endsOn),
            weeklyTargetCount: period.weeklyTargetCount,
          })),
        },
      },
      include: {
        tasks: {
          include: {
            mediaLinks: {
              orderBy: { sortOrder: "asc" },
              include: {
                mediaAsset: true,
              },
            },
          },
        },
        periods: true,
      },
    });
  }

  async getById(currentUser: AuthenticatedUser, routineId: string) {
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
          take: 10,
          include: {
            taskTimings: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });

    if (!routine) {
      throw new NotFoundException("Feladatsor nem talalhato.");
    }

    return routine;
  }

  async update(currentUser: AuthenticatedUser, routineId: string, input: UpdateRoutineDto) {
    await this.getById(currentUser, routineId);
    return this.prisma.routine.update({
      where: { id: routineId },
      data: {
        name: input.name,
        description: input.description,
      },
    });
  }

  async remove(currentUser: AuthenticatedUser, routineId: string) {
    await this.getById(currentUser, routineId);
    await this.prisma.routine.delete({
      where: { id: routineId },
    });
    return { success: true };
  }

  async getProgress(currentUser: AuthenticatedUser, routineId: string) {
    const routine = await this.prisma.routine.findFirst({
      where: {
        id: routineId,
        child: {
          ownerId: currentUser.sub,
        },
      },
      include: {
        periods: {
          orderBy: { startsOn: "asc" },
        },
        sessions: {
          where: {
            status: SessionStatus.COMPLETED,
            completedAt: {
              not: null,
            },
          },
          orderBy: {
            completedAt: "asc",
          },
          select: {
            id: true,
            completedAt: true,
            totalSeconds: true,
          },
        },
      },
    });

    if (!routine) {
      throw new NotFoundException("Feladatsor nem talalhato.");
    }

    const periods = routine.periods.map((period) => {
      const sessionsInPeriod = routine.sessions.filter((session) => {
        const completedAt = session.completedAt;
        return completedAt && completedAt >= period.startsOn && completedAt <= period.endsOn;
      });

      const weeks = buildWeeklyBuckets(period.startsOn, period.endsOn).map((bucket) => {
        const completedSessions = sessionsInPeriod.filter((session) => {
          const completedAt = session.completedAt;
          return completedAt && completedAt >= bucket.weekStart && completedAt <= bucket.weekEnd;
        }).length;

        return {
          weekStart: bucket.weekStart.toISOString(),
          weekEnd: bucket.weekEnd.toISOString(),
          targetSessions: period.weeklyTargetCount,
          completedSessions,
          targetMet: completedSessions >= period.weeklyTargetCount,
        };
      });

      return {
        id: period.id,
        name: period.name,
        startsOn: period.startsOn,
        endsOn: period.endsOn,
        weeklyTargetCount: period.weeklyTargetCount,
        totalCompletedSessions: sessionsInPeriod.length,
        weeks,
      };
    });

    return {
      routineId: routine.id,
      periodCount: periods.length,
      periods,
    };
  }
}

function parseMediaKind(kind: "IMAGE" | "AUDIO" | "VIDEO" | "EXTERNAL_LINK") {
  return MediaKind[kind];
}

function buildWeeklyBuckets(startsOn: Date, endsOn: Date) {
  const buckets: Array<{ weekStart: Date; weekEnd: Date }> = [];
  let cursor = startOfWeek(startsOn);

  while (cursor <= endsOn) {
    const bucketStart = new Date(Math.max(cursor.getTime(), startsOn.getTime()));
    const rawWeekEnd = endOfWeek(cursor);
    const bucketEnd = new Date(Math.min(rawWeekEnd.getTime(), endsOn.getTime()));
    buckets.push({
      weekStart: bucketStart,
      weekEnd: bucketEnd,
    });
    cursor = addDays(endOfWeek(cursor), 1);
  }

  return buckets;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  start.setDate(start.getDate() + 6);
  start.setHours(23, 59, 59, 999);
  return start;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
