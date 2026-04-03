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

  async listBadges(currentUser: AuthenticatedUser, childId: string) {
    await this.getById(currentUser, childId);

    return this.prisma.badgeAward.findMany({
      where: {
        childId,
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
    });
  }
}
