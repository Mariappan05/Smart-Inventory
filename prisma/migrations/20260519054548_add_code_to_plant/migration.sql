/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Plant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Plant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "code" VARCHAR(10) NOT NULL;

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "toolName" VARCHAR(160) NOT NULL,
    "operations" JSONB NOT NULL DEFAULT '[]',
    "supplierName" VARCHAR(160) NOT NULL,
    "supplierCode" VARCHAR(100) NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativeMonthlySchedule" (
    "id" TEXT NOT NULL,
    "customerName" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TentativeMonthlySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativeMonthlyScheduleItem" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TentativeMonthlyScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativeMonthlyScheduleItemTool" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TentativeMonthlyScheduleItemTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tool_itemId_idx" ON "Tool"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_itemId_toolName_supplierCode_key" ON "Tool"("itemId", "toolName", "supplierCode");

-- CreateIndex
CREATE INDEX "TentativeMonthlySchedule_customerName_idx" ON "TentativeMonthlySchedule"("customerName");

-- CreateIndex
CREATE INDEX "TentativeMonthlyScheduleItem_scheduleId_idx" ON "TentativeMonthlyScheduleItem"("scheduleId");

-- CreateIndex
CREATE INDEX "TentativeMonthlyScheduleItem_componentId_idx" ON "TentativeMonthlyScheduleItem"("componentId");

-- CreateIndex
CREATE INDEX "TentativeMonthlyScheduleItemTool_itemId_idx" ON "TentativeMonthlyScheduleItemTool"("itemId");

-- CreateIndex
CREATE INDEX "TentativeMonthlyScheduleItemTool_toolId_idx" ON "TentativeMonthlyScheduleItemTool"("toolId");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_code_key" ON "Plant"("code");

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativeMonthlyScheduleItem" ADD CONSTRAINT "TentativeMonthlyScheduleItem_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TentativeMonthlySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativeMonthlyScheduleItem" ADD CONSTRAINT "TentativeMonthlyScheduleItem_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativeMonthlyScheduleItemTool" ADD CONSTRAINT "TentativeMonthlyScheduleItemTool_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "TentativeMonthlyScheduleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativeMonthlyScheduleItemTool" ADD CONSTRAINT "TentativeMonthlyScheduleItemTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
