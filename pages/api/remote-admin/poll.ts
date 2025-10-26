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

    // Verify API key and get server info
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

    const { gameId, placeId, jobId } = req.body;

    // Update server last seen
    await prisma.gameServer.update({
      where: { id: server.id },
      data: { lastSeen: new Date() }
    });

    // Get pending commands for this server (specific server or broadcast to all)
    const pendingCommands = await prisma.serverCommandQueue.findMany({
      where: {
        OR: [
          { serverId: server.id },  // Commands for this specific server
          { serverId: null }        // Broadcast commands for all servers
        ],
        status: "pending"
      },
      orderBy: [
        { priority: "desc" },  // Higher priority first
        { createdAt: "asc" }   // Older commands first within same priority
      ],
      take: 10, // Limit to 10 commands per poll
      include: {
        executor: {
          select: {
            username: true
          }
        }
      }
    });

    if (pendingCommands.length === 0) {
      // No commands pending
      return res.status(200).json({
        commands: [],
        serverStatus: "active"
      });
    }

    // Mark commands as delivered
    const commandIds = pendingCommands.map(cmd => cmd.id);
    await prisma.serverCommandQueue.updateMany({
      where: {
        id: { in: commandIds }
      },
      data: {
        status: "delivered",
        deliveredAt: new Date()
      }
    });

    // Format commands for game server
    const formattedCommands = pendingCommands.map(cmd => ({
      id: cmd.id,
      command: cmd.command,
      targetUserId: cmd.targetUserId?.toString(),
      parameters: cmd.parameters,
      executedBy: {
        username: cmd.executor.username
      },
      timestamp: cmd.createdAt.toISOString()
    }));

    return res.status(200).json({
      commands: formattedCommands,
      serverStatus: "active"
    });

  } catch (error) {
    console.error("Command polling error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Cleanup function to remove old delivered commands (run periodically)
export async function cleanupOldCommands() {
  try {
    // Remove commands older than 24 hours that have been delivered
    await prisma.serverCommandQueue.deleteMany({
      where: {
        status: "delivered",
        deliveredAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        }
      }
    });
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}