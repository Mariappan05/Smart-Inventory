-- Add product fields to Item model
ALTER TABLE "Item" ADD COLUMN "itemCode" VARCHAR(100) UNIQUE,
ADD COLUMN "description" TEXT,
ADD COLUMN "lifeDuration" VARCHAR(100),
ADD COLUMN "unitPrice" DOUBLE PRECISION DEFAULT 0;
