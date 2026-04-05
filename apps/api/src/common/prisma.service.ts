import { Injectable, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  override get taskCatalogItem(): Prisma.TaskCatalogItemDelegate {
    return super.taskCatalogItem;
  }

  override get taskCatalogMediaLink(): Prisma.TaskCatalogMediaLinkDelegate {
    return super.taskCatalogMediaLink;
  }

  override get taskCatalogEquipment(): Prisma.TaskCatalogEquipmentDelegate {
    return super.taskCatalogEquipment;
  }

  override get taskCatalogDifficultyLevel(): Prisma.TaskCatalogDifficultyLevelDelegate {
    return super.taskCatalogDifficultyLevel;
  }

  override get songCatalogItem(): Prisma.SongCatalogItemDelegate {
    return super.songCatalogItem;
  }

  override get equipmentCatalogItem(): Prisma.EquipmentCatalogItemDelegate {
    return super.equipmentCatalogItem;
  }

  async onModuleInit() {
    await this.$connect();
  }
}
