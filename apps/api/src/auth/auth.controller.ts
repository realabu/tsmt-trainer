import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "./auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { AuthenticatedUser } from "./auth.types";
import { LoginDto, RefreshTokenDto, RegisterDto, UpdateProfileDto } from "./dto";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @Post("login")
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }

  @Post("refresh")
  refresh(@Body() input: RefreshTokenDto) {
    return this.authService.refresh(input);
  }

  @Post("logout")
  logout(@Body() input: RefreshTokenDto) {
    return this.authService.logout(input);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get("me")
  me(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.me(currentUser);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch("me")
  updateProfile(@CurrentUser() currentUser: AuthenticatedUser, @Body() input: UpdateProfileDto) {
    return this.authService.updateProfile(currentUser, input);
  }
}
