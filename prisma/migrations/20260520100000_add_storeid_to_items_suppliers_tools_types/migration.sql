-- Add storeId column to Item table
ALTER TABLE "Item" ADD COLUMN "storeId" TEXT;

-- Add storeId column to Supplier table
ALTER TABLE "Supplier" ADD COLUMN "storeId" TEXT;

-- Add storeId column to Tool table
ALTER TABLE "Tool" ADD COLUMN "storeId" TEXT;

-- Add storeId column to Type table
ALTER TABLE "Type" ADD COLUMN "storeId" TEXT;

-- Migrate existing data: Set storeId based on createdBy user's storeId
UPDATE "Item" SET "storeId" = (
  SELECT "storeId" FROM "User" WHERE "User"."id" = "Item"."createdById"
) WHERE "createdById" IS NOT NULL;

UPDATE "Supplier" SET "storeId" = (
  SELECT "storeId" FROM "User" WHERE "User"."id" = "Supplier"."createdById"
) WHERE "createdById" IS NOT NULL;

UPDATE "Tool" SET "storeId" = (
  SELECT "storeId" FROM "User" WHERE "User"."id" = "Tool"."createdById"
) WHERE "createdById" IS NOT NULL;

UPDATE "Type" SET "storeId" = (
  SELECT "storeId" FROM "User" WHERE "User"."id" = "Type"."createdById"
) WHERE "createdById" IS NOT NULL;

-- Add foreign key constraints
ALTER TABLE "Item" ADD CONSTRAINT "Item_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Type" ADD CONSTRAINT "Type_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX "Item_storeId_idx" ON "Item"("storeId");
CREATE INDEX "Supplier_storeId_idx" ON "Supplier"("storeId");
CREATE INDEX "Tool_storeId_idx" ON "Tool"("storeId");
CREATE INDEX "Type_storeId_idx" ON "Type"("storeId");
