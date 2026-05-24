-- Add isDefault column to Store table
ALTER TABLE "Store" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
