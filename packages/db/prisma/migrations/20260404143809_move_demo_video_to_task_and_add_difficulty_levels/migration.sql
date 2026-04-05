/*
  Warnings:

  - You are about to drop the column `demoVideoUrl` on the `SongCatalogItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RoutineTask" ADD COLUMN     "catalogDifficultyLevelId" TEXT;

-- AlterTable
ALTER TABLE "SongCatalogItem" DROP COLUMN "demoVideoUrl";

-- AlterTable
ALTER TABLE "TaskCatalogItem" ADD COLUMN     "demoVideoUrl" TEXT;

-- CreateTable
CREATE TABLE "TaskCatalogDifficultyLevel" (
    "id" TEXT NOT NULL,
    "taskCatalogItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TaskCatalogDifficultyLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskCatalogDifficultyLevel_taskCatalogItemId_sortOrder_idx" ON "TaskCatalogDifficultyLevel"("taskCatalogItemId", "sortOrder");

-- AddForeignKey
ALTER TABLE "RoutineTask" ADD CONSTRAINT "RoutineTask_catalogDifficultyLevelId_fkey" FOREIGN KEY ("catalogDifficultyLevelId") REFERENCES "TaskCatalogDifficultyLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCatalogDifficultyLevel" ADD CONSTRAINT "TaskCatalogDifficultyLevel_taskCatalogItemId_fkey" FOREIGN KEY ("taskCatalogItemId") REFERENCES "TaskCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
