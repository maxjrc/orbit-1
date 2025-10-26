import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    // Verify API key
    const apiKey = authHeader.replace("Bearer ", "");
    const server = await prisma.gameServer.findFirst({
      where: {
        apiKey: apiKey,
        isActive: true
      }
    });

    if (!server) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const { type, data } = req.body;

    switch (type) {
      case "chat_message":
        await handleChatMessage(server.id, data);
        break;
      case "player_join":
        await handlePlayerJoin(server.id, data);
        break;
      case "player_leave":
        await handlePlayerLeave(server.id, data);
        break;
      case "player_action":
        await handlePlayerAction(server.id, data);
        break;
      case "server_metrics":
        await handleServerMetrics(server.id, data);
        break;
      case "game_event":
        await handleGameEvent(server.id, data);
        break;
      default:
        return res.status(400).json({ error: "Unknown event type" });
    }

    // Update server last seen
    await prisma.gameServer.update({
      where: { id: server.id },
      data: {
        lastSeen: new Date(),
        ...(data.playerCount !== undefined && { playerCount: data.playerCount })
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Activity API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleChatMessage(serverId: string, data: any) {
  const { userId, username, message, filtered = false } = data;

  // Basic profanity filter
  const flaggedWords = ["badword1", "badword2"]; // Add your filter words
  const flagged = flaggedWords.some(word => message.toLowerCase().includes(word.toLowerCase()));

  await prisma.chatMessage.create({
    data: {
      serverId,
      userId: BigInt(userId),
      username,
      message,
      filtered,
      flagged
    }
  });
}

async function handlePlayerJoin(serverId: string, data: any) {
  const { userId, username, sessionData } = data;

  await prisma.gameEvent.create({
    data: {
      serverId,
      eventType: "player_join",
      userId: BigInt(userId),
      username,
      data: sessionData
    }
  });
}

async function handlePlayerLeave(serverId: string, data: any) {
  const { userId, username, sessionData } = data;

  await prisma.gameEvent.create({
    data: {
      serverId,
      eventType: "player_leave",
      userId: BigInt(userId),
      username,
      data: sessionData
    }
  });
}

async function handlePlayerAction(serverId: string, data: any) {
  const { userId, username, actionType, position, additionalData } = data;

  await prisma.playerAction.create({
    data: {
      serverId,
      userId: BigInt(userId),
      username,
      actionType,
      position: position || null,
      data: additionalData || null
    }
  });
}

async function handleServerMetrics(serverId: string, data: any) {
  const { playerCount, activePlayers, performance } = data;

  await prisma.serverMetrics.create({
    data: {
      serverId,
      playerCount,
      activePlayers: activePlayers || null,
      performance: performance || null
    }
  });
}

async function handleGameEvent(serverId: string, data: any) {
  const { eventType, userId, username, eventData } = data;

  await prisma.gameEvent.create({
    data: {
      serverId,
      eventType,
      userId: userId ? BigInt(userId) : null,
      username: username || null,
      data: eventData || null
    }
  });
}