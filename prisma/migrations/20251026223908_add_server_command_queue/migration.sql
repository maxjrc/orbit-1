-- CreateTable
CREATE TABLE "ServerCommandQueue" (
    "id" UUID NOT NULL,
    "serverId" UUID,
    "command" TEXT NOT NULL,
    "targetUserId" BIGINT,
    "parameters" JSONB,
    "executedBy" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "ServerCommandQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServerCommandQueue_serverId_idx" ON "ServerCommandQueue"("serverId");

-- CreateIndex
CREATE INDEX "ServerCommandQueue_status_idx" ON "ServerCommandQueue"("status");

-- CreateIndex
CREATE INDEX "ServerCommandQueue_priority_createdAt_idx" ON "ServerCommandQueue"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "ServerCommandQueue_targetUserId_idx" ON "ServerCommandQueue"("targetUserId");

-- AddForeignKey
ALTER TABLE "ServerCommandQueue" ADD CONSTRAINT "ServerCommandQueue_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerCommandQueue" ADD CONSTRAINT "ServerCommandQueue_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES "user"("userid") ON DELETE RESTRICT ON UPDATE CASCADE;
