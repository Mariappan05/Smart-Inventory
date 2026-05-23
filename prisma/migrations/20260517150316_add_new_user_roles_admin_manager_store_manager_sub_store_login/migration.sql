-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'ADMIN_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'STORE_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'SUB_STORE_LOGIN';

-- DropIndex
DROP INDEX "Item_supplierId_name_key";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "imagesJson" TEXT,
ADD COLUMN     "typeId" TEXT;

-- AlterTable
ALTER TABLE "ProductOutLog" ADD COLUMN     "issuedToId" TEXT;

-- CreateIndex
CREATE INDEX "Item_typeId_idx" ON "Item"("typeId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;
