-- Rename Plant table to Store
ALTER TABLE "Plant" RENAME TO "Store";

-- Rename Plant indexes
ALTER INDEX "Plant_name_key" RENAME TO "Store_name_key";
ALTER INDEX "Plant_code_key" RENAME TO "Store_code_key";
ALTER INDEX "Plant_createdById_idx" RENAME TO "Store_createdById_idx";

-- Rename foreign key columns in all related tables
ALTER TABLE "User" RENAME COLUMN "plantId" TO "storeId";
ALTER TABLE "Product" RENAME COLUMN "plantId" TO "storeId";
ALTER TABLE "ProductOutLog" RENAME COLUMN "fromPlantId" TO "fromStoreId";
ALTER TABLE "ProductInLog" RENAME COLUMN "toPlantId" TO "toStoreId";
ALTER TABLE "QrScanLog" RENAME COLUMN "plantId" TO "storeId";
ALTER TABLE "SecurityAlert" RENAME COLUMN "plantId" TO "storeId";
ALTER TABLE "ProductMovementLog" RENAME COLUMN "fromPlantId" TO "fromStoreId";
ALTER TABLE "ProductMovementLog" RENAME COLUMN "toPlantId" TO "toStoreId";
ALTER TABLE "ProductMaintenanceLog" RENAME COLUMN "plantId" TO "storeId";
ALTER TABLE "Schedule" RENAME COLUMN "plantId" TO "storeId";
ALTER TABLE "Schedule" RENAME COLUMN "completedByPlantId" TO "completedByStoreId";
ALTER TABLE "TentativeMonthlySchedule" RENAME COLUMN "plantId" TO "storeId";

-- Rename indexes for foreign keys
ALTER INDEX "User_plantId_idx" RENAME TO "User_storeId_idx";
ALTER INDEX "Product_plantId_idx" RENAME TO "Product_storeId_idx";
ALTER INDEX "ProductOutLog_fromPlantId_idx" RENAME TO "ProductOutLog_fromStoreId_idx";
ALTER INDEX "ProductInLog_toPlantId_idx" RENAME TO "ProductInLog_toStoreId_idx";
ALTER INDEX "QrScanLog_plantId_idx" RENAME TO "QrScanLog_storeId_idx";
ALTER INDEX "SecurityAlert_plantId_idx" RENAME TO "SecurityAlert_storeId_idx";
ALTER INDEX "ProductMovementLog_fromPlantId_idx" RENAME TO "ProductMovementLog_fromStoreId_idx";
ALTER INDEX "ProductMovementLog_toPlantId_idx" RENAME TO "ProductMovementLog_toStoreId_idx";
ALTER INDEX "ProductMaintenanceLog_plantId_idx" RENAME TO "ProductMaintenanceLog_storeId_idx";
ALTER INDEX "Schedule_plantId_idx" RENAME TO "Schedule_storeId_idx";
ALTER INDEX "Schedule_completedByPlantId_idx" RENAME TO "Schedule_completedByStoreId_idx";
