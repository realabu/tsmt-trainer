-- AlterTable
ALTER TABLE "RoutineTask" ADD COLUMN     "catalogTaskId" TEXT,
ADD COLUMN     "coachText" TEXT,
ADD COLUMN     "customImageMediaId" TEXT,
ADD COLUMN     "repetitionCount" INTEGER,
ADD COLUMN     "repetitionSchemeRaw" TEXT,
ADD COLUMN     "repetitionUnitCount" INTEGER,
ADD COLUMN     "songId" TEXT;

-- CreateTable
CREATE TABLE "TaskCatalogItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "instructions" TEXT,
    "focusPoints" TEXT,
    "defaultSongId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongCatalogItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lyrics" TEXT,
    "audioMediaId" TEXT,
    "videoMediaId" TEXT,
    "demoVideoUrl" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SongCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentCatalogItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconMediaId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCatalogMediaLink" (
    "id" TEXT NOT NULL,
    "taskCatalogItemId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TaskCatalogMediaLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCatalogEquipment" (
    "taskCatalogItemId" TEXT NOT NULL,
    "equipmentCatalogItemId" TEXT NOT NULL,

    CONSTRAINT "TaskCatalogEquipment_pkey" PRIMARY KEY ("taskCatalogItemId","equipmentCatalogItemId")
);

-- AddForeignKey
ALTER TABLE "RoutineTask" ADD CONSTRAINT "RoutineTask_catalogTaskId_fkey" FOREIGN KEY ("catalogTaskId") REFERENCES "TaskCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineTask" ADD CONSTRAINT "RoutineTask_songId_fkey" FOREIGN KEY ("songId") REFERENCES "SongCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineTask" ADD CONSTRAINT "RoutineTask_customImageMediaId_fkey" FOREIGN KEY ("customImageMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCatalogItem" ADD CONSTRAINT "TaskCatalogItem_defaultSongId_fkey" FOREIGN KEY ("defaultSongId") REFERENCES "SongCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongCatalogItem" ADD CONSTRAINT "SongCatalogItem_audioMediaId_fkey" FOREIGN KEY ("audioMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongCatalogItem" ADD CONSTRAINT "SongCatalogItem_videoMediaId_fkey" FOREIGN KEY ("videoMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentCatalogItem" ADD CONSTRAINT "EquipmentCatalogItem_iconMediaId_fkey" FOREIGN KEY ("iconMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCatalogMediaLink" ADD CONSTRAINT "TaskCatalogMediaLink_taskCatalogItemId_fkey" FOREIGN KEY ("taskCatalogItemId") REFERENCES "TaskCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCatalogMediaLink" ADD CONSTRAINT "TaskCatalogMediaLink_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCatalogEquipment" ADD CONSTRAINT "TaskCatalogEquipment_taskCatalogItemId_fkey" FOREIGN KEY ("taskCatalogItemId") REFERENCES "TaskCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCatalogEquipment" ADD CONSTRAINT "TaskCatalogEquipment_equipmentCatalogItemId_fkey" FOREIGN KEY ("equipmentCatalogItemId") REFERENCES "EquipmentCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
