-- CreateTable
CREATE TABLE "GameServer" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gameId" BIGINT NOT NULL,
    "universeId" BIGINT,
    "serverUrl" TEXT,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" TIMESTAMP(3),
    "playerCount" INTEGER NOT NULL DEFAULT 0,
    "maxPlayers" INTEGER NOT NULL DEFAULT 100,
    "workspaceGroupId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerCommand" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "command" TEXT NOT NULL,
    "parameters" JSONB,
    "executedBy" BIGINT NOT NULL,
    "response" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerMetrics" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "activePlayers" JSONB,
    "performance" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "userId" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "filtered" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "moderatedBy" BIGINT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" BIGINT,
    "username" TEXT,
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerAction" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "userId" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "position" JSONB,
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameServer_workspaceGroupId_idx" ON "GameServer"("workspaceGroupId");

-- CreateIndex
CREATE INDEX "GameServer_gameId_idx" ON "GameServer"("gameId");

-- CreateIndex
CREATE INDEX "ServerCommand_serverId_idx" ON "ServerCommand"("serverId");

-- CreateIndex
CREATE INDEX "ServerCommand_executedBy_idx" ON "ServerCommand"("executedBy");

-- CreateIndex
CREATE INDEX "ServerCommand_status_idx" ON "ServerCommand"("status");

-- CreateIndex
CREATE INDEX "ServerMetrics_serverId_idx" ON "ServerMetrics"("serverId");

-- CreateIndex
CREATE INDEX "ServerMetrics_timestamp_idx" ON "ServerMetrics"("timestamp");

-- CreateIndex
CREATE INDEX "ChatMessage_serverId_idx" ON "ChatMessage"("serverId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_timestamp_idx" ON "ChatMessage"("timestamp");

-- CreateIndex
CREATE INDEX "ChatMessage_flagged_idx" ON "ChatMessage"("flagged");

-- CreateIndex
CREATE INDEX "GameEvent_serverId_idx" ON "GameEvent"("serverId");

-- CreateIndex
CREATE INDEX "GameEvent_eventType_idx" ON "GameEvent"("eventType");

-- CreateIndex
CREATE INDEX "GameEvent_userId_idx" ON "GameEvent"("userId");

-- CreateIndex
CREATE INDEX "GameEvent_timestamp_idx" ON "GameEvent"("timestamp");

-- CreateIndex
CREATE INDEX "PlayerAction_serverId_idx" ON "PlayerAction"("serverId");

-- CreateIndex
CREATE INDEX "PlayerAction_userId_idx" ON "PlayerAction"("userId");

-- CreateIndex
CREATE INDEX "PlayerAction_actionType_idx" ON "PlayerAction"("actionType");

-- CreateIndex
CREATE INDEX "PlayerAction_timestamp_idx" ON "PlayerAction"("timestamp");

-- AddForeignKey
ALTER TABLE "GameServer" ADD CONSTRAINT "GameServer_workspaceGroupId_fkey" FOREIGN KEY ("workspaceGroupId") REFERENCES "workspace"("groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerCommand" ADD CONSTRAINT "ServerCommand_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerCommand" ADD CONSTRAINT "ServerCommand_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES "user"("userid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerMetrics" ADD CONSTRAINT "ServerMetrics_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "user"("userid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAction" ADD CONSTRAINT "PlayerAction_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
