import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";
import { CreateChildDto, UpdateChildDto } from "./dto";

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  async list(currentUser: AuthenticatedUser) {
    return this.prisma.child.findMany({
      where: {
        ownerId: currentUser.sub,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      include: {
        _count: {
          select: {
            routines: true,
            sessions: true,
          },
        },
      },
    });
  }

  async create(currentUser: AuthenticatedUser, input: CreateChildDto) {
    return this.prisma.child.create({
      data: {
        ownerId: currentUser.sub,
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        notes: input.notes,
      },
    });
  }

  async getById(currentUser: AuthenticatedUser, childId: string) {
    const child = await this.prisma.child.findFirst({
      where: {
        id: childId,
        ownerId: currentUser.sub,
      },
      include: {
        routines: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { sessions: true, tasks: true },
            },
          },
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!child) {
      throw new NotFoundException("Gyerek nem talalhato.");
    }

    return child;
  }

  async update(currentUser: AuthenticatedUser, childId: string, input: UpdateChildDto) {
    await this.getById(currentUser, childId);

    return this.prisma.child.update({
      where: { id: childId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        notes: input.notes,
      },
    });
  }

  async remove(currentUser: AuthenticatedUser, childId: string) {
    await this.getById(currentUser, childId);
    await this.prisma.child.delete({
      where: { id: childId },
    });
    return { success: true };
  }

  async getDeleteImpact(currentUser: AuthenticatedUser, childId: string) {
    const child = await this.getById(currentUser, childId);

    const [
      routineCount,
      routineTaskCount,
      taskMediaLinkCount,
      periodCount,
      sessionCount,
      sessionTaskTimingCount,
      badgeAwardCount,
      trainerAssignmentCount,
    ] = await Promise.all([
      this.prisma.routine.count({
        where: { childId },
      }),
      this.prisma.routineTask.count({
        where: {
          routine: {
            childId,
          },
        },
      }),
      this.prisma.taskMediaLink.count({
        where: {
          task: {
            routine: {
              childId,
            },
          },
        },
      }),
      this.prisma.routinePeriod.count({
        where: {
          routine: {
            childId,
          },
        },
      }),
      this.prisma.session.count({
        where: { childId },
      }),
      this.prisma.sessionTaskTiming.count({
        where: {
          session: {
            childId,
          },
        },
      }),
      this.prisma.badgeAward.count({
        where: { childId },
      }),
      this.prisma.routineAssignment.count({
        where: { childId },
      }),
    ]);

    return {
      entityType: "child",
      entityId: child.id,
      entityLabel: `${child.firstName} ${child.lastName}`,
      deletes: [
        { label: "Feladatsor", count: routineCount },
        { label: "Feladat", count: routineTaskCount },
        { label: "Feladat media kapcsolat", count: taskMediaLinkCount },
        { label: "Idoszak", count: periodCount },
        { label: "Torna", count: sessionCount },
        { label: "Reszido bejegyzes", count: sessionTaskTimingCount },
        { label: "Badge megszerzes", count: badgeAwardCount },
        { label: "Trainer megosztas", count: trainerAssignmentCount },
      ],
      detaches: [],
      notes: [
        "A gyerek torlesevel minden hozza tartozo feladatsor, tornaelozmeny es badge megszerzes is vegleg torlodik.",
      ],
    };
  }

  async listBadges(currentUser: AuthenticatedUser, childId: string, routineId?: string) {
    await this.getById(currentUser, childId);

    const [definitions, awards] = await Promise.all([
      this.prisma.badgeDefinition.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ createdAt: "asc" }, { title: "asc" }],
      }),
      this.prisma.badgeAward.findMany({
        where: {
          childId,
          ...(routineId
            ? {
                OR: [{ routineId }, { routineId: null }],
              }
            : {}),
        },
        orderBy: {
          awardedAt: "desc",
        },
        include: {
          badgeDefinition: true,
          routine: {
            select: {
              id: true,
              name: true,
            },
          },
          period: {
            select: {
              id: true,
              name: true,
              startsOn: true,
              endsOn: true,
            },
          },
        },
      }),
    ]);

    return definitions.map((definition) => {
      const matchingAwards = awards.filter((award) => award.badgeDefinitionId === definition.id);
      const latestAward = matchingAwards[0] ?? null;
      const scope =
        definition.triggerType === "ROUTINE_RECORD"
          || definition.triggerType === "ROUTINE_SESSION_COUNT"
          ? "routine"
          : definition.triggerType === "WEEKLY_GOAL_COMPLETED" || definition.triggerType === "PERIOD_TARGET_COMPLETED"
            ? "period"
            : "child";
      const breakdownMap = new Map<
        string,
        {
          routineId: string | null;
          routineName: string | null;
          periodId: string | null;
          periodName: string | null;
          count: number;
          lastAwardedAt: Date;
        }
      >();

      for (const award of matchingAwards) {
        const key = `${award.routineId ?? "child"}::${award.periodId ?? "none"}`;
        const existing = breakdownMap.get(key);

        if (existing) {
          existing.count += 1;
          if (award.awardedAt > existing.lastAwardedAt) {
            existing.lastAwardedAt = award.awardedAt;
          }
          continue;
        }

        breakdownMap.set(key, {
          routineId: award.routineId ?? null,
          routineName: award.routine?.name ?? null,
          periodId: award.periodId ?? null,
          periodName: award.period?.name ?? null,
          count: 1,
          lastAwardedAt: award.awardedAt,
        });
      }

      return {
        id: definition.id,
        code: definition.code,
        title: definition.title,
        description: definition.description,
        iconUrl: definition.iconUrl,
        scope,
        triggerType: definition.triggerType,
        earned: matchingAwards.length > 0,
        awardCount: matchingAwards.length,
        lastAwardedAt: latestAward?.awardedAt ?? null,
        lastAwardReason: latestAward?.reason ?? null,
        latestRoutine: latestAward?.routine ?? null,
        latestPeriod: latestAward?.period ?? null,
        awardBreakdown: [...breakdownMap.values()].sort((a, b) => b.lastAwardedAt.getTime() - a.lastAwardedAt.getTime()),
      };
    });
  }
}
