import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { ChildrenModule } from "./children/children.module";
import { CommonModule } from "./common/common.module";
import { HealthModule } from "./health/health.module";
import { RoutinesModule } from "./routines/routines.module";
import { SessionsModule } from "./sessions/sessions.module";
import { TrainersModule } from "./trainers/trainers.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AdminModule,
    CommonModule,
    HealthModule,
    AuthModule,
    ChildrenModule,
    RoutinesModule,
    SessionsModule,
    TrainersModule,
  ],
})
export class AppModule {}
