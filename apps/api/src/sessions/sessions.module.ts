import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SessionBadgeAwardService } from "./session-badge-award.service";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionBadgeAwardService],
})
export class SessionsModule {}
