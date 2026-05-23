-- AddField stockQuantity to Item
ALTER TABLE "Item" ADD COLUMN "stockQuantity" INTEGER NOT NULL DEFAULT 0;

-- AddField minimumQuantity to Item
ALTER TABLE "Item" ADD COLUMN "minimumQuantity" INTEGER NOT NULL DEFAULT 10;

-- AddField reorderQuantity to Item
ALTER TABLE "Item" ADD COLUMN "reorderQuantity" INTEGER NOT NULL DEFAULT 50;

-- AddField billUrl to Schedule
ALTER TABLE "Schedule" ADD COLUMN "billUrl" VARCHAR(500);

-- AddField qrCode to Schedule
ALTER TABLE "Schedule" ADD COLUMN "qrCode" TEXT;

-- AddField reminderSent to Schedule
ALTER TABLE "Schedule" ADD COLUMN "reminderSent" BOOLEAN NOT NULL DEFAULT false;
