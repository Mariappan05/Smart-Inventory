-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "ProductMaintenanceLog" ADD COLUMN     "plantId" TEXT;

-- AlterTable
ALTER TABLE "QrScanLog" ADD COLUMN     "plantId" TEXT;

-- AlterTable
ALTER TABLE "SecurityAlert" ADD COLUMN     "plantId" TEXT;

-- AlterTable
ALTER TABLE "TentativeMonthlySchedule" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "plantId" TEXT;

-- AlterTable
ALTER TABLE "Type" ADD COLUMN     "createdById" TEXT;

-- CreateIndex
CREATE INDEX "Plant_createdById_idx" ON "Plant"("createdById");

-- CreateIndex
CREATE INDEX "ProductMaintenanceLog_plantId_idx" ON "ProductMaintenanceLog"("plantId");

-- CreateIndex
CREATE INDEX "QrScanLog_plantId_idx" ON "QrScanLog"("plantId");

-- CreateIndex
CREATE INDEX "SecurityAlert_plantId_idx" ON "SecurityAlert"("plantId");

-- CreateIndex
CREATE INDEX "TentativeMonthlySchedule_plantId_idx" ON "TentativeMonthlySchedule"("plantId");

-- CreateIndex
CREATE INDEX "TentativeMonthlySchedule_createdById_idx" ON "TentativeMonthlySchedule"("createdById");

-- CreateIndex
CREATE INDEX "Type_createdById_idx" ON "Type"("createdById");

-- AddForeignKey
ALTER TABLE "Type" ADD CONSTRAINT "Type_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativeMonthlySchedule" ADD CONSTRAINT "TentativeMonthlySchedule_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativeMonthlySchedule" ADD CONSTRAINT "TentativeMonthlySchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrScanLog" ADD CONSTRAINT "QrScanLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaintenanceLog" ADD CONSTRAINT "ProductMaintenanceLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
