/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductMaintenanceLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductMovementLog` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('order_created', 'order_allocated', 'order_completed', 'order_delivered', 'order_closed', 'request_received');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMaintenanceLog" DROP CONSTRAINT "ProductMaintenanceLog_performedById_fkey";

-- DropForeignKey
ALTER TABLE "ProductMaintenanceLog" DROP CONSTRAINT "ProductMaintenanceLog_plantId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMaintenanceLog" DROP CONSTRAINT "ProductMaintenanceLog_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMovementLog" DROP CONSTRAINT "ProductMovementLog_fromPlantId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMovementLog" DROP CONSTRAINT "ProductMovementLog_movedById_fkey";

-- DropForeignKey
ALTER TABLE "ProductMovementLog" DROP CONSTRAINT "ProductMovementLog_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMovementLog" DROP CONSTRAINT "ProductMovementLog_toPlantId_fkey";

-- DropIndex
DROP INDEX "Notification_userId_isRead_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "Store" RENAME CONSTRAINT "Plant_pkey" TO "Store_pkey";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "ProductMaintenanceLog";

-- DropTable
DROP TABLE "ProductMovementLog";

-- DropEnum
DROP TYPE "MaintenanceType";

-- DropEnum
DROP TYPE "MovementType";

-- CreateTable
CREATE TABLE "ToolRequest" (
    "id" TEXT NOT NULL,
    "toolName" VARCHAR(160) NOT NULL,
    "componentName" VARCHAR(160) NOT NULL,
    "componentCode" VARCHAR(100) NOT NULL,
    "productionQuantity" INTEGER NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "machineNumber" VARCHAR(100) NOT NULL,
    "machineCode" VARCHAR(100) NOT NULL,
    "storeCode" VARCHAR(10) NOT NULL,
    "storeName" VARCHAR(120) NOT NULL,
    "targetStoreId" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPO" (
    "id" TEXT NOT NULL,
    "poNumber" VARCHAR(100) NOT NULL,
    "supplierName" VARCHAR(160) NOT NULL,
    "supplierCode" VARCHAR(100) NOT NULL,
    "pdfUrl" VARCHAR(500),
    "pdfFileName" VARCHAR(255),
    "totalAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InwardEntry" (
    "id" TEXT NOT NULL,
    "poNumber" VARCHAR(100),
    "invoiceNumber" VARCHAR(100),
    "invoiceDate" VARCHAR(50),
    "productDetails" JSONB NOT NULL,
    "qrCode" TEXT,
    "barcode" VARCHAR(200),
    "storeId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InwardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "storeId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Production" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT,
    "machineId" TEXT,
    "machineName" VARCHAR(160) NOT NULL,
    "machineCode" VARCHAR(100) NOT NULL,
    "componentName" VARCHAR(160) NOT NULL,
    "componentCode" VARCHAR(100) NOT NULL,
    "operation" VARCHAR(160) NOT NULL,
    "toolName" VARCHAR(160) NOT NULL,
    "productionQuantity" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Production_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolRequest_storeCode_idx" ON "ToolRequest"("storeCode");

-- CreateIndex
CREATE INDEX "ToolRequest_targetStoreId_idx" ON "ToolRequest"("targetStoreId");

-- CreateIndex
CREATE INDEX "ToolRequest_status_idx" ON "ToolRequest"("status");

-- CreateIndex
CREATE INDEX "ToolRequest_createdById_idx" ON "ToolRequest"("createdById");

-- CreateIndex
CREATE INDEX "ToolRequest_fromDate_idx" ON "ToolRequest"("fromDate");

-- CreateIndex
CREATE INDEX "ToolRequest_createdAt_idx" ON "ToolRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPO_poNumber_key" ON "SupplierPO"("poNumber");

-- CreateIndex
CREATE INDEX "SupplierPO_poNumber_idx" ON "SupplierPO"("poNumber");

-- CreateIndex
CREATE INDEX "SupplierPO_supplierCode_idx" ON "SupplierPO"("supplierCode");

-- CreateIndex
CREATE INDEX "SupplierPO_createdAt_idx" ON "SupplierPO"("createdAt");

-- CreateIndex
CREATE INDEX "InwardEntry_poNumber_idx" ON "InwardEntry"("poNumber");

-- CreateIndex
CREATE INDEX "InwardEntry_invoiceNumber_idx" ON "InwardEntry"("invoiceNumber");

-- CreateIndex
CREATE INDEX "InwardEntry_storeId_idx" ON "InwardEntry"("storeId");

-- CreateIndex
CREATE INDEX "InwardEntry_createdAt_idx" ON "InwardEntry"("createdAt");

-- CreateIndex
CREATE INDEX "Machine_storeId_idx" ON "Machine"("storeId");

-- CreateIndex
CREATE INDEX "Machine_createdById_idx" ON "Machine"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_code_storeId_key" ON "Machine"("code", "storeId");

-- CreateIndex
CREATE INDEX "Production_date_idx" ON "Production"("date");

-- CreateIndex
CREATE INDEX "Production_storeId_idx" ON "Production"("storeId");

-- CreateIndex
CREATE INDEX "Production_machineId_idx" ON "Production"("machineId");

-- CreateIndex
CREATE INDEX "Production_createdById_idx" ON "Production"("createdById");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- RenameForeignKey
ALTER TABLE "Product" RENAME CONSTRAINT "Product_plantId_fkey" TO "Product_storeId_fkey";

-- RenameForeignKey
ALTER TABLE "ProductInLog" RENAME CONSTRAINT "ProductInLog_toPlantId_fkey" TO "ProductInLog_toStoreId_fkey";

-- RenameForeignKey
ALTER TABLE "ProductOutLog" RENAME CONSTRAINT "ProductOutLog_fromPlantId_fkey" TO "ProductOutLog_fromStoreId_fkey";

-- RenameForeignKey
ALTER TABLE "QrScanLog" RENAME CONSTRAINT "QrScanLog_plantId_fkey" TO "QrScanLog_storeId_fkey";

-- RenameForeignKey
ALTER TABLE "Schedule" RENAME CONSTRAINT "Schedule_completedByPlantId_fkey" TO "Schedule_completedByStoreId_fkey";

-- RenameForeignKey
ALTER TABLE "Schedule" RENAME CONSTRAINT "Schedule_plantId_fkey" TO "Schedule_storeId_fkey";

-- RenameForeignKey
ALTER TABLE "SecurityAlert" RENAME CONSTRAINT "SecurityAlert_plantId_fkey" TO "SecurityAlert_storeId_fkey";

-- RenameForeignKey
ALTER TABLE "Store" RENAME CONSTRAINT "Plant_createdById_fkey" TO "Store_createdById_fkey";

-- RenameForeignKey
ALTER TABLE "TentativeMonthlySchedule" RENAME CONSTRAINT "TentativeMonthlySchedule_plantId_fkey" TO "TentativeMonthlySchedule_storeId_fkey";

-- RenameForeignKey
ALTER TABLE "User" RENAME CONSTRAINT "User_plantId_fkey" TO "User_storeId_fkey";

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Production" ADD CONSTRAINT "Production_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Production" ADD CONSTRAINT "Production_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Production" ADD CONSTRAINT "Production_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "TentativeMonthlySchedule_plantId_idx" RENAME TO "TentativeMonthlySchedule_storeId_idx";
