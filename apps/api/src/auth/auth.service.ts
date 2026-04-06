import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../common/prisma.service";
import type { AuthenticatedUser } from "./auth.types";
import { LoginDto, RefreshTokenDto, RegisterDto, UpdateProfileDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: RegisterDto) {
    const email = input.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("Ez az email cim mar foglalt.");
    }

    const passwordHash = await hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role === "TRAINER" ? UserRole.TRAINER : UserRole.PARENT,
        subscriptions: {
          create: {
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.FREE,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return this.issueTokens(user);
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Hibas email vagy jelszo.");
    }

    const isValidPassword = await compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException("Hibas email vagy jelszo.");
    }

    return this.issueTokens(user);
  }

  async refresh(input: RefreshTokenDto) {
    const tokenHash = this.hashToken(input.refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException("Ervenytelen refresh token.");
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(storedToken.user);
  }

  async me(currentUser: AuthenticatedUser) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: currentUser.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(currentUser: AuthenticatedUser, input: UpdateProfileDto) {
    const nextEmail = input.email?.toLowerCase();

    if (nextEmail) {
      const conflictingUser = await this.prisma.user.findFirst({
        where: {
          email: nextEmail,
          NOT: { id: currentUser.sub },
        },
        select: { id: true },
      });

      if (conflictingUser) {
        throw new ConflictException("Ez az email cim mar foglalt.");
      }
    }

    const passwordHash = input.password ? await hash(input.password, 12) : undefined;

    return this.prisma.user.update({
      where: { id: currentUser.sub },
      data: {
        email: nextEmail,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async logout(input: RefreshTokenDto) {
    const tokenHash = this.hashToken(input.refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true };
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) {
    const payload: AuthenticatedUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: "15m",
    });

    const refreshToken = randomBytes(48).toString("hex");
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  private hashToken(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
}
