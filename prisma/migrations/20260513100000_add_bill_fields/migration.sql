-- Add bill fields to Schedule model
ALTER TABLE "Schedule" ADD COLUMN "deliveryDate" TIMESTAMP(3),
ADD COLUMN "supplierBillNumber" VARCHAR(100);

-- Add BILL_GENERATED status to ScheduleStatus enum (PostgreSQL)
ALTER TYPE "ScheduleStatus" ADD VALUE 'BILL_GENERATED' BEFORE 'COMPLETED';
