import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RoutineDeleteImpactService } from "./routine-delete-impact.service";
import { RoutinesController } from "./routines.controller";
import { RoutinesService } from "./routines.service";

@Module({
  imports: [AuthModule],
  controllers: [RoutinesController],
  providers: [RoutinesService, RoutineDeleteImpactService],
})
export class RoutinesModule {}
