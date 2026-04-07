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
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import {
  CreateRoutineDto,
  CreateRoutinePeriodDto,
  CreateRoutineTaskDto,
  UpdateRoutineDto,
  UpdateRoutinePeriodDto,
  UpdateRoutineTaskDto,
} from "./dto";
import { RoutinesService } from "./routines.service";

@ApiTags("routines")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("routines")
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @ApiQuery({ name: "childId", required: false })
  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser, @Query("childId") childId?: string) {
    return this.routinesService.listByChild(currentUser, childId);
  }

  @Post()
  create(@CurrentUser() currentUser: AuthenticatedUser, @Body() input: CreateRoutineDto) {
    return this.routinesService.create(currentUser, input);
  }

  @ApiQuery({ name: "q", required: false })
  @Get("task-catalog/search")
  searchTaskCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Query("q") query?: string) {
    return this.routinesService.searchTaskCatalog(currentUser, query);
  }

  @ApiQuery({ name: "q", required: false })
  @Get("song-catalog")
  listSongCatalog(@CurrentUser() currentUser: AuthenticatedUser, @Query("q") query?: string) {
    return this.routinesService.listSongCatalog(currentUser, query);
  }

  @Get(":id/delete-impact")
  getDeleteImpact(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") routineId: string) {
    return this.routinesService.getDeleteImpact(currentUser, routineId);
  }

  @Get(":id")
  getById(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") routineId: string) {
    return this.routinesService.getById(currentUser, routineId);
  }

  @Get(":id/progress")
  getProgress(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") routineId: string) {
    return this.routinesService.getProgress(currentUser, routineId);
  }

  @Post(":id/tasks")
  createTask(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") routineId: string,
    @Body() input: CreateRoutineTaskDto,
  ) {
    return this.routinesService.createTask(currentUser, routineId, input);
  }

  @Patch("tasks/:taskId")
  updateTask(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("taskId") taskId: string,
    @Body() input: UpdateRoutineTaskDto,
  ) {
    return this.routinesService.updateTask(currentUser, taskId, input);
  }

  @Get("tasks/:taskId/delete-impact")
  getTaskDeleteImpact(@CurrentUser() currentUser: AuthenticatedUser, @Param("taskId") taskId: string) {
    return this.routinesService.getTaskDeleteImpact(currentUser, taskId);
  }

  @Delete("tasks/:taskId")
  removeTask(@CurrentUser() currentUser: AuthenticatedUser, @Param("taskId") taskId: string) {
    return this.routinesService.removeTask(currentUser, taskId);
  }

  @Post(":id/periods")
  createPeriod(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") routineId: string,
    @Body() input: CreateRoutinePeriodDto,
  ) {
    return this.routinesService.createPeriod(currentUser, routineId, input);
  }

  @Patch("periods/:periodId")
  updatePeriod(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("periodId") periodId: string,
    @Body() input: UpdateRoutinePeriodDto,
  ) {
    return this.routinesService.updatePeriod(currentUser, periodId, input);
  }

  @Delete("periods/:periodId")
  removePeriod(@CurrentUser() currentUser: AuthenticatedUser, @Param("periodId") periodId: string) {
    return this.routinesService.removePeriod(currentUser, periodId);
  }

  @Get("periods/:periodId/delete-impact")
  getPeriodDeleteImpact(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("periodId") periodId: string,
  ) {
    return this.routinesService.getPeriodDeleteImpact(currentUser, periodId);
  }

  @Patch(":id")
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") routineId: string,
    @Body() input: UpdateRoutineDto,
  ) {
    return this.routinesService.update(currentUser, routineId, input);
  }

  @Delete(":id")
  remove(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") routineId: string) {
    return this.routinesService.remove(currentUser, routineId);
  }
}
