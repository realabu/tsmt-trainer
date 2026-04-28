import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminCatalogService } from "./admin-catalog.service";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminUserService } from "./admin-user.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminCatalogService, AdminUserService],
})
export class AdminModule {}
