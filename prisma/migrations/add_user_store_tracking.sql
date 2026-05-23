-- Migration: Add User and Store Tracking Fields
-- This migration adds createdById and plantId fields to complete user and store tracking

-- Add createdById to Type
ALTER TABLE "Type" ADD COLUMN "createdById" TEXT;
CREATE INDEX "Type_createdById_idx" ON "Type"("createdById");
ALTER TABLE "Type" ADD CONSTRAINT "Type_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add createdById to Plant
ALTER TABLE "Plant" ADD COLUMN "createdById" TEXT;
CREATE INDEX "Plant_createdById_idx" ON "Plant"("createdById");
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add createdById and plantId to TentativeMonthlySchedule
ALTER TABLE "TentativeMonthlySchedule" ADD COLUMN "createdById" TEXT;
ALTER TABLE "TentativeMonthlySchedule" ADD COLUMN "plantId" TEXT;
CREATE INDEX "TentativeMonthlySchedule_createdById_idx" ON "TentativeMonthlySchedule"("createdById");
CREATE INDEX "TentativeMonthlySchedule_plantId_idx" ON "TentativeMonthlySchedule"("plantId");
ALTER TABLE "TentativeMonthlySchedule" ADD CONSTRAINT "TentativeMonthlySchedule_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TentativeMonthlySchedule" ADD CONSTRAINT "TentativeMonthlySchedule_plantId_fkey" 
  FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add plantId to ProductMaintenanceLog
ALTER TABLE "ProductMaintenanceLog" ADD COLUMN "plantId" TEXT;
CREATE INDEX "ProductMaintenanceLog_plantId_idx" ON "ProductMaintenanceLog"("plantId");
ALTER TABLE "ProductMaintenanceLog" ADD CONSTRAINT "ProductMaintenanceLog_plantId_fkey" 
  FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add plantId to SecurityAlert
ALTER TABLE "SecurityAlert" ADD COLUMN "plantId" TEXT;
CREATE INDEX "SecurityAlert_plantId_idx" ON "SecurityAlert"("plantId");
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_plantId_fkey" 
  FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add plantId to QrScanLog
ALTER TABLE "QrScanLog" ADD COLUMN "plantId" TEXT;
CREATE INDEX "QrScanLog_plantId_idx" ON "QrScanLog"("plantId");
ALTER TABLE "QrScanLog" ADD CONSTRAINT "QrScanLog_plantId_fkey" 
  FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
