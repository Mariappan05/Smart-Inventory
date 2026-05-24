-- CreateTable
CREATE TABLE "ToolRequest" (
    "id" TEXT NOT NULL,
    "toolName" VARCHAR(160) NOT NULL,
    "componentName" VARCHAR(160) NOT NULL,
    "componentCode" VARCHAR(100) NOT NULL,
    "productionQuantity" INTEGER NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "machineNumber" VARCHAR(100) NOT NULL,
    "machineCode" VARCHAR(100) NOT NULL,
    "storeCode" VARCHAR(10) NOT NULL,
    "storeName" VARCHAR(120) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolRequest_storeCode_idx" ON "ToolRequest"("storeCode");

-- CreateIndex
CREATE INDEX "ToolRequest_createdById_idx" ON "ToolRequest"("createdById");

-- CreateIndex
CREATE INDEX "ToolRequest_fromDate_idx" ON "ToolRequest"("fromDate");

-- CreateIndex
CREATE INDEX "ToolRequest_createdAt_idx" ON "ToolRequest"("createdAt");
