-- AlterTable
ALTER TABLE "BadgeAward" ADD COLUMN     "contextKey" TEXT;

-- CreateIndex
CREATE INDEX "BadgeAward_childId_badgeDefinitionId_contextKey_idx" ON "BadgeAward"("childId", "badgeDefinitionId", "contextKey");
