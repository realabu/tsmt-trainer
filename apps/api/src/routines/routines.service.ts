import { MediaKind, Prisma, SessionStatus, type SongCatalogItem, type TaskCatalogDifficultyLevel, type TaskCatalogItem } from "@prisma/client";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";
import {
  CreateRoutineDto,
  CreateRoutinePeriodDto,
  CreateRoutineTaskDto,
  UpdateRoutineDto,
  UpdateRoutinePeriodDto,
  UpdateRoutineTaskDto,
} from "./dto";

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  private routineTaskInclude() {
    return {
      catalogTask: {
        include: {
          defaultSong: true,
          difficultyLevels: {
            orderBy: { sortOrder: "asc" as const },
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
        },
      },
      catalogDifficultyLevel: true,
      song: {
        include: {
          audioMedia: true,
          videoMedia: true,
        },
      },
      customImageMedia: true,
      mediaLinks: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          mediaAsset: true,
        },
      },
    } satisfies Prisma.RoutineTaskInclude;
  }

  private async getOwnedRoutine(currentUser: AuthenticatedUser, routineId: string) {
    const routine = await this.prisma.routine.findFirst({
      where: {
        id: routineId,
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
      throw new NotFoundException("Feladatsor nem talalhato.");
    }

    return routine;
  }

  private async getOwnedRoutineTask(currentUser: AuthenticatedUser, taskId: string) {
    const task = await this.prisma.routineTask.findFirst({
      where: {
        id: taskId,
        routine: {
          child: {
            ownerId: currentUser.sub,
          },
        },
      },
      select: {
        id: true,
        routineId: true,
        customImageMediaId: true,
      },
    });

    if (!task) {
      throw new NotFoundException("Feladat nem talalhato.");
    }

    return task;
  }

  private async getOwnedRoutinePeriod(currentUser: AuthenticatedUser, periodId: string) {
    const period = await this.prisma.routinePeriod.findFirst({
      where: {
        id: periodId,
        routine: {
          child: {
            ownerId: currentUser.sub,
          },
        },
      },
      select: {
        id: true,
        routineId: true,
      },
    });

    if (!period) {
      throw new NotFoundException("Idoszak nem talalhato.");
    }

    return period;
  }

  private async resolveTaskInput(input: CreateRoutineTaskDto | UpdateRoutineTaskDto, sortOrder: number) {
    const catalogTask = input.catalogTaskId
      ? await this.prisma.taskCatalogItem.findFirst({
          where: {
            id: input.catalogTaskId,
            isActive: true,
          },
          include: {
            defaultSong: true,
            difficultyLevels: {
              orderBy: { sortOrder: "asc" },
            },
          },
        })
      : null;

    if (input.catalogTaskId && !catalogTask) {
      throw new NotFoundException("Az egyik kivalasztott katalogus feladat nem talalhato.");
    }

    const selectedDifficultyLevel = input.catalogDifficultyLevelId
      ? await this.prisma.taskCatalogDifficultyLevel.findUnique({
          where: { id: input.catalogDifficultyLevelId },
        })
      : null;

    if (input.catalogDifficultyLevelId && !selectedDifficultyLevel) {
      throw new NotFoundException("A kivalasztott nehezsegi szint nem talalhato.");
    }

    if (
      selectedDifficultyLevel &&
      (!catalogTask || selectedDifficultyLevel.taskCatalogItemId !== catalogTask.id)
    ) {
      throw new BadRequestException(
        "A kivalasztott nehezsegi szint nem ehhez a katalogus taskhoz tartozik.",
      );
    }

    const explicitSongId =
      input.songId === undefined ? undefined : input.songId || null;

    const resolvedSongId =
      explicitSongId === undefined ? catalogTask?.defaultSongId ?? undefined : explicitSongId;

    if (resolvedSongId) {
      const song = await this.prisma.songCatalogItem.findFirst({
        where: {
          id: resolvedSongId,
          isActive: true,
        },
        select: { id: true },
      });

      if (!song) {
        throw new NotFoundException("A rutin feladathoz megadott dal vagy mondoka nem talalhato.");
      }
    }

    const title = input.title ?? catalogTask?.title;

    if (!title) {
      throw new BadRequestException("Minden rutin feladathoz kell cim vagy katalogus forras.");
    }

    return {
      sortOrder: input.sortOrder ?? sortOrder,
      catalogTaskId: input.catalogTaskId || null,
      catalogDifficultyLevelId: input.catalogDifficultyLevelId || null,
      songId: resolvedSongId ?? null,
      title,
      details: input.details ?? catalogTask?.summary ?? null,
      coachText: input.coachText ?? null,
      repetitionsLabel: input.repetitionsLabel ?? null,
      repetitionSchemeRaw: input.repetitionSchemeRaw ?? null,
      repetitionCount: input.repetitionCount ?? null,
      repetitionUnitCount: input.repetitionUnitCount ?? null,
      customImageExternalUrl: input.customImageExternalUrl || null,
      mediaLinks: input.mediaLinks ?? [],
    };
  }

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
          include: this.routineTaskInclude(),
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

    const resolvedTasks = await Promise.all(
      input.tasks.map((task, index) => this.resolveTaskInput(task, index + 1)),
    );

    return this.prisma.routine.create({
      data: {
        childId: input.childId,
        name: input.name,
        description: input.description,
        tasks: {
          create: resolvedTasks.map((task) => this.buildRoutineTaskCreate(task)),
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
          include: this.routineTaskInclude(),
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
          include: this.routineTaskInclude(),
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

  async listSongCatalog(currentUser: AuthenticatedUser, query?: string) {
    if (!currentUser.sub) {
      throw new NotFoundException("Felhasznalo nem talalhato.");
    }

    const q = query?.trim();

    return this.prisma.songCatalogItem.findMany({
      where: {
        isActive: true,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { lyrics: { contains: q, mode: "insensitive" } },
                { notes: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { title: "asc" },
      include: {
        audioMedia: true,
        videoMedia: true,
      },
    });
  }

  async createTask(currentUser: AuthenticatedUser, routineId: string, input: CreateRoutineTaskDto) {
    await this.getOwnedRoutine(currentUser, routineId);
    const resolvedTask = await this.resolveTaskInput(input, input.sortOrder ?? 1);

    const currentMax = await this.prisma.routineTask.aggregate({
      where: { routineId },
      _max: { sortOrder: true },
    });

    const created = await this.prisma.routineTask.create({
      data: {
        routine: {
          connect: {
            id: routineId,
          },
        },
        sortOrder: resolvedTask.sortOrder || (currentMax._max.sortOrder ?? 0) + 1,
        title: resolvedTask.title,
        details: resolvedTask.details,
        coachText: resolvedTask.coachText,
        repetitionsLabel: resolvedTask.repetitionsLabel,
        repetitionSchemeRaw: resolvedTask.repetitionSchemeRaw,
        repetitionCount: resolvedTask.repetitionCount,
        repetitionUnitCount: resolvedTask.repetitionUnitCount,
        catalogTask: resolvedTask.catalogTaskId
          ? {
              connect: {
                id: resolvedTask.catalogTaskId,
              },
            }
          : undefined,
        catalogDifficultyLevel: resolvedTask.catalogDifficultyLevelId
          ? {
              connect: {
                id: resolvedTask.catalogDifficultyLevelId,
              },
            }
          : undefined,
        song: resolvedTask.songId
          ? {
              connect: {
                id: resolvedTask.songId,
              },
            }
          : undefined,
        customImageMedia: resolvedTask.customImageExternalUrl
          ? {
              create: {
                kind: MediaKind.IMAGE,
                externalUrl: resolvedTask.customImageExternalUrl,
              },
            }
          : undefined,
        mediaLinks: {
          create: resolvedTask.mediaLinks.map((media, mediaIndex) => ({
            label: media.label,
            sortOrder: mediaIndex,
            mediaAsset: {
              create: {
                kind: parseMediaKind(media.kind),
                externalUrl: media.externalUrl,
              },
            },
          })),
        },
      } satisfies Prisma.RoutineTaskCreateInput,
      include: this.routineTaskInclude(),
    });

    return created;
  }

  async updateTask(currentUser: AuthenticatedUser, taskId: string, input: UpdateRoutineTaskDto) {
    const task = await this.getOwnedRoutineTask(currentUser, taskId);
    const resolvedTask = await this.resolveTaskInput(input, input.sortOrder ?? 1);

    await this.prisma.taskMediaLink.deleteMany({
      where: { taskId },
    });

    const updated = await this.prisma.routineTask.update({
      where: { id: taskId },
      data: {
        sortOrder: resolvedTask.sortOrder,
        title: resolvedTask.title,
        details: resolvedTask.details,
        coachText: resolvedTask.coachText,
        repetitionsLabel: resolvedTask.repetitionsLabel,
        repetitionSchemeRaw: resolvedTask.repetitionSchemeRaw,
        repetitionCount: resolvedTask.repetitionCount,
        repetitionUnitCount: resolvedTask.repetitionUnitCount,
        catalogTask: resolvedTask.catalogTaskId
          ? {
              connect: {
                id: resolvedTask.catalogTaskId,
              },
            }
          : { disconnect: true },
        catalogDifficultyLevel: resolvedTask.catalogDifficultyLevelId
          ? {
              connect: {
                id: resolvedTask.catalogDifficultyLevelId,
              },
            }
          : { disconnect: true },
        song: resolvedTask.songId
          ? {
              connect: {
                id: resolvedTask.songId,
              },
            }
          : { disconnect: true },
        customImageMedia: resolvedTask.customImageExternalUrl
          ? task.customImageMediaId
            ? {
                update: {
                  kind: MediaKind.IMAGE,
                  externalUrl: resolvedTask.customImageExternalUrl,
                },
              }
            : {
                create: {
                  kind: MediaKind.IMAGE,
                  externalUrl: resolvedTask.customImageExternalUrl,
                },
              }
          : task.customImageMediaId
            ? { disconnect: true }
            : undefined,
        mediaLinks: {
          create: resolvedTask.mediaLinks.map((media, mediaIndex) => ({
            label: media.label,
            sortOrder: mediaIndex,
            mediaAsset: {
              create: {
                kind: parseMediaKind(media.kind),
                externalUrl: media.externalUrl,
              },
            },
          })),
        },
      } satisfies Prisma.RoutineTaskUpdateInput,
      include: this.routineTaskInclude(),
    });

    return updated;
  }

  async removeTask(currentUser: AuthenticatedUser, taskId: string) {
    await this.getOwnedRoutineTask(currentUser, taskId);
    await this.prisma.routineTask.delete({
      where: { id: taskId },
    });
    return { success: true };
  }

  async createPeriod(currentUser: AuthenticatedUser, routineId: string, input: CreateRoutinePeriodDto) {
    await this.getOwnedRoutine(currentUser, routineId);

    return this.prisma.routinePeriod.create({
      data: {
        routineId,
        name: input.name,
        startsOn: new Date(input.startsOn),
        endsOn: new Date(input.endsOn),
        weeklyTargetCount: input.weeklyTargetCount,
      },
    });
  }

  async updatePeriod(currentUser: AuthenticatedUser, periodId: string, input: UpdateRoutinePeriodDto) {
    await this.getOwnedRoutinePeriod(currentUser, periodId);

    return this.prisma.routinePeriod.update({
      where: { id: periodId },
      data: {
        name: input.name,
        startsOn: new Date(input.startsOn),
        endsOn: new Date(input.endsOn),
        weeklyTargetCount: input.weeklyTargetCount,
      },
    });
  }

  async removePeriod(currentUser: AuthenticatedUser, periodId: string) {
    await this.getOwnedRoutinePeriod(currentUser, periodId);
    await this.prisma.routinePeriod.delete({
      where: { id: periodId },
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
        const targetSessions = getProRatedWeeklyTarget(
          period.weeklyTargetCount,
          bucket.weekStart,
          bucket.weekEnd,
        );

        return {
          weekStart: bucket.weekStart.toISOString(),
          weekEnd: bucket.weekEnd.toISOString(),
          targetSessions,
          completedSessions,
          targetMet: completedSessions >= targetSessions,
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

  async searchTaskCatalog(currentUser: AuthenticatedUser, query?: string) {
    if (!currentUser.sub) {
      throw new NotFoundException("Felhasznalo nem talalhato.");
    }

    const q = query?.trim();

    return this.prisma.taskCatalogItem.findMany({
      where: {
        ...(q
          ? ({
              isActive: true,
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { summary: { contains: q, mode: "insensitive" } },
                { instructions: { contains: q, mode: "insensitive" } },
                { focusPoints: { contains: q, mode: "insensitive" } },
                { demoVideoUrl: { contains: q, mode: "insensitive" } },
                {
                  defaultSong: {
                    is: {
                      title: { contains: q, mode: "insensitive" },
                    },
                  },
                },
                {
                  equipmentLinks: {
                    some: {
                      equipmentCatalogItem: {
                        name: { contains: q, mode: "insensitive" },
                      },
                    },
                  },
                },
                {
                  difficultyLevels: {
                    some: {
                      OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { description: { contains: q, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            })
          : { isActive: true }),
      },
      orderBy: { title: "asc" },
      take: 20,
      include: {
        defaultSong: {
          include: {
            audioMedia: true,
            videoMedia: true,
          },
        },
        mediaLinks: {
          orderBy: { sortOrder: "asc" },
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
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  private buildRoutineTaskCreate(
    task: Awaited<ReturnType<RoutinesService["resolveTaskInput"]>>,
    currentMaxSortOrder = 0,
  ) {
    const sortOrder = task.sortOrder || currentMaxSortOrder + 1;

    return {
      sortOrder,
      catalogTaskId: task.catalogTaskId,
      catalogDifficultyLevelId: task.catalogDifficultyLevelId,
      songId: task.songId,
      title: task.title,
      details: task.details,
      coachText: task.coachText,
      repetitionsLabel: task.repetitionsLabel,
      repetitionSchemeRaw: task.repetitionSchemeRaw,
      repetitionCount: task.repetitionCount,
      repetitionUnitCount: task.repetitionUnitCount,
      customImageMedia: task.customImageExternalUrl
        ? {
            create: {
              kind: MediaKind.IMAGE,
              externalUrl: task.customImageExternalUrl,
            },
          }
        : undefined,
      mediaLinks: {
        create: task.mediaLinks.map((media, mediaIndex) => ({
          label: media.label,
          sortOrder: mediaIndex,
          mediaAsset: {
            create: {
              kind: parseMediaKind(media.kind),
              externalUrl: media.externalUrl,
            },
          },
        })),
      },
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

function getProRatedWeeklyTarget(weeklyTargetCount: number, weekStart: Date, weekEnd: Date) {
  const coveredDays = getInclusiveDayCount(weekStart, weekEnd);
  const rawTarget = (weeklyTargetCount * coveredDays) / 7;
  return Math.round(rawTarget);
}

function getInclusiveDayCount(start: Date, end: Date) {
  const normalizedStart = new Date(start);
  const normalizedEnd = new Date(end);
  normalizedStart.setHours(0, 0, 0, 0);
  normalizedEnd.setHours(0, 0, 0, 0);

  const diffMs = normalizedEnd.getTime() - normalizedStart.getTime();
  return Math.max(1, Math.floor(diffMs / 86_400_000) + 1);
}
