-- Add variant field and make description and lifeDuration required
ALTER TABLE "Item" 
ADD COLUMN "variant" VARCHAR(100);

-- Set default values for existing NULL records
UPDATE "Item" SET "description" = '' WHERE "description" IS NULL;
UPDATE "Item" SET "lifeDuration" = '0 days' WHERE "lifeDuration" IS NULL;

-- Make columns NOT NULL
ALTER TABLE "Item" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "Item" ALTER COLUMN "lifeDuration" SET NOT NULL;

