import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { UpdateUserDto } from "./dto";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  listUsers(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.adminService.listUsers(currentUser);
  }

  @Patch("users/:id")
  updateUser(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") userId: string,
    @Body() input: UpdateUserDto,
  ) {
    return this.adminService.updateUser(currentUser, userId, input);
  }

  @Delete("users/:id")
  deleteUser(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") userId: string) {
    return this.adminService.deleteUser(currentUser, userId);
  }

  @Get("parents")
  listParents(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.adminService.listParents(currentUser);
  }

  @Get("parents/:id/children")
  listChildren(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") parentId: string) {
    return this.adminService.listChildrenByParent(currentUser, parentId);
  }

  @ApiQuery({ name: "parentId", required: false })
  @ApiQuery({ name: "childId", required: false })
  @Get("routines")
  listRoutines(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query("parentId") parentId?: string,
    @Query("childId") childId?: string,
  ) {
    return this.adminService.listRoutines(currentUser, parentId, childId);
  }

  @Get("routines/:id")
  getRoutine(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") routineId: string) {
    return this.adminService.getRoutineDetail(currentUser, routineId);
  }

  @ApiQuery({ name: "parentId", required: false })
  @ApiQuery({ name: "childId", required: false })
  @ApiQuery({ name: "routineId", required: false })
  @Get("sessions")
  listSessions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query("parentId") parentId?: string,
    @Query("childId") childId?: string,
    @Query("routineId") routineId?: string,
  ) {
    return this.adminService.listSessions(currentUser, parentId, childId, routineId);
  }

  @Get("sessions/:id")
  getSession(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") sessionId: string) {
    return this.adminService.getSessionDetail(currentUser, sessionId);
  }
}
