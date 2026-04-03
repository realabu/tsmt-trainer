import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { CancelSessionDto, CompleteTaskDto, FinishSessionDto } from "./dto";
import { SessionsService } from "./sessions.service";

@ApiTags("sessions")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post("routines/:routineId/sessions/start")
  start(@CurrentUser() currentUser: AuthenticatedUser, @Param("routineId") routineId: string) {
    return this.sessionsService.start(currentUser, routineId);
  }

  @ApiQuery({ name: "routineId", required: false })
  @ApiQuery({ name: "childId", required: false })
  @Get("sessions")
  list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query("routineId") routineId?: string,
    @Query("childId") childId?: string,
  ) {
    return this.sessionsService.listByRoutine(currentUser, routineId, childId);
  }

  @Get("sessions/:id")
  getById(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") sessionId: string) {
    return this.sessionsService.getById(currentUser, sessionId);
  }

  @Post("sessions/:id/tasks/complete")
  completeTask(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") sessionId: string,
    @Body() input: CompleteTaskDto,
  ) {
    return this.sessionsService.completeTask(currentUser, sessionId, input);
  }

  @Post("sessions/:id/finish")
  finish(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") sessionId: string,
    @Body() input: FinishSessionDto,
  ) {
    return this.sessionsService.finish(currentUser, sessionId, input);
  }

  @Post("sessions/:id/cancel")
  cancel(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") sessionId: string,
    @Body() input: CancelSessionDto,
  ) {
    return this.sessionsService.cancel(currentUser, sessionId, input);
  }
}
