-- AlterTable
ALTER TABLE "User" ADD COLUMN "plantId" TEXT;

-- CreateIndex
CREATE INDEX "User_plantId_idx" ON "User"("plantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
