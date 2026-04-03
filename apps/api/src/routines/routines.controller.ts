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
import { CreateRoutineDto, UpdateRoutineDto } from "./dto";
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

  @Get(":id")
  getById(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") routineId: string) {
    return this.routinesService.getById(currentUser, routineId);
  }

  @Get(":id/progress")
  getProgress(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") routineId: string) {
    return this.routinesService.getProgress(currentUser, routineId);
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
