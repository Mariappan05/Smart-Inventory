-- AlterTable
ALTER TABLE "Store" RENAME CONSTRAINT "Plant_pkey" TO "Store_pkey";

-- RenameForeignKey
ALTER TABLE "Product" RENAME CONSTRAINT "Product_plantId_fkey" TO "Product_storeId_fkey";

-- RenameForeignKey
ALTER TABLE "ProductInLog" RENAME CONSTRAINT "ProductInLog_toPlantId_fkey" TO "ProductInLog_toStoreId_fkey";

-- RenameForeignKey
ALTER TABLE "ProductMaintenanceLog" RENAME CONSTRAINT "ProductMaintenanceLog_plantId_fkey" TO "ProductMaintenanceLog_storeId_fkey";

-- RenameForeignKey
ALTER TABLE "ProductMovementLog" RENAME CONSTRAINT "ProductMovementLog_fromPlantId_fkey" TO "ProductMovementLog_fromStoreId_fkey";

-- RenameForeignKey
ALTER TABLE "ProductMovementLog" RENAME CONSTRAINT "ProductMovementLog_toPlantId_fkey" TO "ProductMovementLog_toStoreId_fkey";

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

-- RenameIndex
ALTER INDEX "TentativeMonthlySchedule_plantId_idx" RENAME TO "TentativeMonthlySchedule_storeId_idx";
