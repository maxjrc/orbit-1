import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { withPermissionCheck } from "@/utils/permissionsManager";

const prisma = new PrismaClient();

export default withPermissionCheck(handler, "admin");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const workspaceId = parseInt(id as string);

  if (!workspaceId || isNaN(workspaceId)) {
    return res.status(400).json({ error: "Invalid workspace ID" });
  }

  try {
    const userId = req.session.userid;

    switch (req.method) {
      case "GET":
        return await handleGet(req, res, workspaceId);
      case "POST":
        return await handlePost(req, res, workspaceId, userId);
      case "PUT":
        return await handlePut(req, res, workspaceId, userId);
      case "DELETE":
        return await handleDelete(req, res, workspaceId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Remote admin API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, workspaceId: number) {
  try {
    // Get all servers for this workspace
    const servers = await prisma.gameServer.findMany({
      where: {
        workspaceGroupId: workspaceId
      },
      include: {
        _count: {
          select: {
            chatMessages: {
              where: {
                timestamp: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              }
            },
            gameEvents: {
              where: {
                timestamp: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Calculate stats
    const stats = {
      totalServers: servers.length,
      activeServers: servers.filter(s => s.isActive).length,
      totalPlayers: servers.reduce((sum, s) => sum + s.playerCount, 0),
      totalChatMessages24h: servers.reduce((sum, s) => sum + s._count.chatMessages, 0),
      totalEvents24h: servers.reduce((sum, s) => sum + s._count.gameEvents, 0)
    };

    // Format servers for response
    const formattedServers = servers.map(server => ({
      id: server.id,
      name: server.name,
      description: server.description,
      gameId: server.gameId.toString(),
      universeId: server.universeId?.toString(),
      playerCount: server.playerCount,
      maxPlayers: server.maxPlayers,
      isActive: server.isActive,
      lastSeen: server.lastSeen?.toISOString(),
      createdAt: server.createdAt.toISOString(),
      chatMessages24h: server._count.chatMessages,
      events24h: server._count.gameEvents
    }));

    return res.status(200).json({
      servers: formattedServers,
      stats
    });
  } catch (error) {
    console.error("Error fetching servers:", error);
    return res.status(500).json({ error: "Failed to fetch servers" });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, workspaceId: number, userId: string) {
  try {
    const { name, description, gameId, universeId, maxPlayers = 100 } = req.body;

    if (!name || !gameId) {
      return res.status(400).json({ error: "Name and Game ID are required" });
    }

    // Generate API key for this server
    const apiKey = generateApiKey();

    const server = await prisma.gameServer.create({
      data: {
        name,
        description,
        gameId: BigInt(gameId),
        universeId: universeId ? BigInt(universeId) : null,
        maxPlayers,
        apiKey,
        workspaceGroupId: workspaceId
      }
    });

    return res.status(201).json({
      id: server.id,
      name: server.name,
      description: server.description,
      gameId: server.gameId.toString(),
      universeId: server.universeId?.toString(),
      apiKey: server.apiKey,
      maxPlayers: server.maxPlayers,
      isActive: server.isActive,
      createdAt: server.createdAt.toISOString()
    });
  } catch (error) {
    console.error("Error creating server:", error);
    return res.status(500).json({ error: "Failed to create server" });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, workspaceId: number, userId: string) {
  try {
    const { serverId, name, description, maxPlayers, isActive } = req.body;

    if (!serverId) {
      return res.status(400).json({ error: "Server ID is required" });
    }

    const server = await prisma.gameServer.update({
      where: {
        id: serverId,
        workspaceGroupId: workspaceId
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(maxPlayers && { maxPlayers }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return res.status(200).json({
      id: server.id,
      name: server.name,
      description: server.description,
      gameId: server.gameId.toString(),
      maxPlayers: server.maxPlayers,
      isActive: server.isActive,
      updatedAt: server.updatedAt.toISOString()
    });
  } catch (error) {
    console.error("Error updating server:", error);
    return res.status(500).json({ error: "Failed to update server" });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, workspaceId: number) {
  try {
    const { serverId } = req.body;

    if (!serverId) {
      return res.status(400).json({ error: "Server ID is required" });
    }

    await prisma.gameServer.delete({
      where: {
        id: serverId,
        workspaceGroupId: workspaceId
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting server:", error);
    return res.status(500).json({ error: "Failed to delete server" });
  }
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "orbit_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}