-- CreateIndex
CREATE INDEX "Schedule_deliveredById_idx" ON "Schedule"("deliveredById");

-- CreateIndex
CREATE INDEX "Schedule_deliveredAt_idx" ON "Schedule"("deliveredAt");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
