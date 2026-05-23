-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('TENTATIVE_MONTHLY', 'FINAL_MONTHLY');

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "componentCode" VARCHAR(100),
ADD COLUMN     "componentName" VARCHAR(160),
ADD COLUMN     "customerName" VARCHAR(160),
ADD COLUMN     "isMonthlySchedule" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduleType" "ScheduleType" NOT NULL DEFAULT 'TENTATIVE_MONTHLY';

-- CreateIndex
CREATE INDEX "Schedule_isMonthlySchedule_idx" ON "Schedule"("isMonthlySchedule");

-- CreateIndex
CREATE INDEX "Schedule_scheduleType_idx" ON "Schedule"("scheduleType");
