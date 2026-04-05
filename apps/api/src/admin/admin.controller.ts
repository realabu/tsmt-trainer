import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import {
  CreateEquipmentCatalogDto,
  CreateSongCatalogDto,
  CreateTaskCatalogDto,
  UpdateEquipmentCatalogDto,
  UpdateSongCatalogDto,
  UpdateTaskCatalogDto,
  UpdateUserDto,
} from "./dto";
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

  @Get("task-catalog")
  listTaskCatalog(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.adminService.listTaskCatalog(currentUser);
  }

  @Post("task-catalog")
  createTaskCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Body() input: CreateTaskCatalogDto) {
    return this.adminService.createTaskCatalog(currentUser, input);
  }

  @Get("task-catalog/:id")
  getTaskCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") taskCatalogId: string) {
    return this.adminService.getTaskCatalogDetail(currentUser, taskCatalogId);
  }

  @Patch("task-catalog/:id")
  updateTaskCatalog(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") taskCatalogId: string,
    @Body() input: UpdateTaskCatalogDto,
  ) {
    return this.adminService.updateTaskCatalog(currentUser, taskCatalogId, input);
  }

  @Delete("task-catalog/:id")
  deleteTaskCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") taskCatalogId: string) {
    return this.adminService.deleteTaskCatalog(currentUser, taskCatalogId);
  }

  @Get("song-catalog")
  listSongCatalog(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.adminService.listSongCatalog(currentUser);
  }

  @Post("song-catalog")
  createSongCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Body() input: CreateSongCatalogDto) {
    return this.adminService.createSongCatalog(currentUser, input);
  }

  @Get("song-catalog/:id")
  getSongCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") songId: string) {
    return this.adminService.getSongCatalogDetail(currentUser, songId);
  }

  @Patch("song-catalog/:id")
  updateSongCatalog(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") songId: string,
    @Body() input: UpdateSongCatalogDto,
  ) {
    return this.adminService.updateSongCatalog(currentUser, songId, input);
  }

  @Delete("song-catalog/:id")
  deleteSongCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") songId: string) {
    return this.adminService.deleteSongCatalog(currentUser, songId);
  }

  @Get("equipment-catalog")
  listEquipmentCatalog(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.adminService.listEquipmentCatalog(currentUser);
  }

  @Post("equipment-catalog")
  createEquipmentCatalog(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateEquipmentCatalogDto,
  ) {
    return this.adminService.createEquipmentCatalog(currentUser, input);
  }

  @Get("equipment-catalog/:id")
  getEquipmentCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") equipmentId: string) {
    return this.adminService.getEquipmentCatalogDetail(currentUser, equipmentId);
  }

  @Patch("equipment-catalog/:id")
  updateEquipmentCatalog(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") equipmentId: string,
    @Body() input: UpdateEquipmentCatalogDto,
  ) {
    return this.adminService.updateEquipmentCatalog(currentUser, equipmentId, input);
  }

  @Delete("equipment-catalog/:id")
  deleteEquipmentCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") equipmentId: string) {
    return this.adminService.deleteEquipmentCatalog(currentUser, equipmentId);
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
