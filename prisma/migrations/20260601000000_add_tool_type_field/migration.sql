-- AlterTable
ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "toolType" TEXT;

-- Update existing tools to have a default toolType
UPDATE "Tool" SET "toolType" = 'Drill' WHERE "toolType" IS NULL;
