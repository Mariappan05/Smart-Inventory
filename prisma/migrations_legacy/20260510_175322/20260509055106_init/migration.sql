-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "MachineCategory_code_idx" ON "MachineCategory"("code");

-- CreateIndex
CREATE INDEX "MachineInLog_inById_idx" ON "MachineInLog"("inById");

-- CreateIndex
CREATE INDEX "MachineMaintenanceLog_performedById_idx" ON "MachineMaintenanceLog"("performedById");

-- CreateIndex
CREATE INDEX "MachineMovementLog_fromStoreRoomId_idx" ON "MachineMovementLog"("fromStoreRoomId");

-- CreateIndex
CREATE INDEX "MachineMovementLog_toStoreRoomId_idx" ON "MachineMovementLog"("toStoreRoomId");

-- CreateIndex
CREATE INDEX "MachineMovementLog_movedById_idx" ON "MachineMovementLog"("movedById");

-- CreateIndex
CREATE INDEX "MachineOutLog_outById_idx" ON "MachineOutLog"("outById");

-- CreateIndex
CREATE INDEX "QrScanLog_scannedById_idx" ON "QrScanLog"("scannedById");

-- CreateIndex
CREATE INDEX "SecurityAlert_reportedById_idx" ON "SecurityAlert"("reportedById");

-- CreateIndex
CREATE INDEX "SecurityAlert_machineId_createdAt_idx" ON "SecurityAlert"("machineId", "createdAt");

-- CreateIndex
CREATE INDEX "UserImage_userId_isPrimary_idx" ON "UserImage"("userId", "isPrimary");
