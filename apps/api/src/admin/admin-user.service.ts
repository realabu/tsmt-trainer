import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../common/prisma.service";
import { UpdateUserDto } from "./dto";

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(_currentUser: AuthenticatedUser) {
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

  async updateUser(_currentUser: AuthenticatedUser, userId: string, input: UpdateUserDto) {
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
    if (currentUser.sub === userId) {
      throw new ForbiddenException("Az admin sajat magat nem torolheti.");
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  async listParents(_currentUser: AuthenticatedUser) {
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

  async listChildrenByParent(_currentUser: AuthenticatedUser, parentId: string) {
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
}
