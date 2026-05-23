-- Drop the existing unique constraint on itemCode
ALTER TABLE "Item" DROP CONSTRAINT IF EXISTS "Item_itemCode_key";

-- Create compound unique constraint on itemCode and storeId
CREATE UNIQUE INDEX "Item_itemCode_storeId_key" ON "Item"("itemCode", "storeId");
