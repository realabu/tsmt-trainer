import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ChildrenService } from "./children.service";
import { CreateChildDto, UpdateChildDto } from "./dto";

@ApiTags("children")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("children")
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.childrenService.list(currentUser);
  }

  @Post()
  create(@CurrentUser() currentUser: AuthenticatedUser, @Body() input: CreateChildDto) {
    return this.childrenService.create(currentUser, input);
  }

  @Get(":id")
  getById(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") childId: string) {
    return this.childrenService.getById(currentUser, childId);
  }

  @Patch(":id")
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") childId: string,
    @Body() input: UpdateChildDto,
  ) {
    return this.childrenService.update(currentUser, childId, input);
  }

  @Delete(":id")
  remove(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") childId: string) {
    return this.childrenService.remove(currentUser, childId);
  }

  @Get(":id/badges")
  listBadges(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id") childId: string,
    @Query("routineId") routineId?: string,
  ) {
    return this.childrenService.listBadges(currentUser, childId, routineId);
  }
}
