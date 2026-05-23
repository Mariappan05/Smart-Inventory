-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('TENTATIVE', 'FINAL', 'COMPLETED', 'DELIVERED', 'CLOSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "scheduleDate" TIMESTAMP(3) NOT NULL,
    "supplierId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "gstAmount" DOUBLE PRECISION NOT NULL,
    "totalWithGst" DOUBLE PRECISION NOT NULL,
    "orderDeliveryDate" TIMESTAMP(3) NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'TENTATIVE',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "completedByPlantId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "deliveredById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Schedule_status_idx" ON "Schedule"("status");

-- CreateIndex
CREATE INDEX "Schedule_orderDeliveryDate_idx" ON "Schedule"("orderDeliveryDate");

-- CreateIndex
CREATE INDEX "Schedule_supplierId_idx" ON "Schedule"("supplierId");

-- CreateIndex
CREATE INDEX "Schedule_typeId_idx" ON "Schedule"("typeId");

-- CreateIndex
CREATE INDEX "Schedule_plantId_idx" ON "Schedule"("plantId");

-- CreateIndex
CREATE INDEX "Schedule_scheduleDate_idx" ON "Schedule"("scheduleDate");

-- CreateIndex
CREATE INDEX "Schedule_completedById_idx" ON "Schedule"("completedById");

-- CreateIndex
CREATE INDEX "Schedule_completedByPlantId_idx" ON "Schedule"("completedByPlantId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_completedByPlantId_fkey" FOREIGN KEY ("completedByPlantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
