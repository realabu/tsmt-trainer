import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { CreateTrainerAssignmentDto } from "./dto";
import { TrainersService } from "./trainers.service";

@ApiTags("trainers")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("trainers")
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Post("assignments")
  createAssignment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateTrainerAssignmentDto,
  ) {
    return this.trainersService.createAssignment(currentUser, input);
  }

  @Get("assignments/owned")
  listOwnedAssignments(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query("childId") childId?: string,
    @Query("routineId") routineId?: string,
  ) {
    return this.trainersService.listOwnedAssignments(currentUser, childId, routineId);
  }

  @Get("assignments")
  listMyAssignments(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.trainersService.listMyAssignments(currentUser);
  }

  @Get("assignments/:id")
  getOverview(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") assignmentId: string) {
    return this.trainersService.getTrainerRoutineOverview(currentUser, assignmentId);
  }

  @Delete("assignments/:id")
  revokeAssignment(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") assignmentId: string) {
    return this.trainersService.revokeAssignment(currentUser, assignmentId);
  }
}
