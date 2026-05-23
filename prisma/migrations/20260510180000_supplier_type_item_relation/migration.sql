/*
  Warnings:

  - A unique constraint covering the columns `[supplierId,name]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supplierId,name]` on the table `Type` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Item_name_key";

-- DropIndex
DROP INDEX "Type_name_key";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "Type" ADD COLUMN     "supplierId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Item_supplierId_name_key" ON "Item"("supplierId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Type_supplierId_name_key" ON "Type"("supplierId", "name");

-- AddForeignKey
ALTER TABLE "Type" ADD CONSTRAINT "Type_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
