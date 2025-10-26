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
    if (req.method === "GET") {
      return await handleGetMessages(req, res, workspaceId);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetMessages(req: NextApiRequest, res: NextApiResponse, workspaceId: number) {
  try {
    const {
      timeRange = "24h",
      serverId,
      flaggedOnly,
      userId: filterUserId,
      search,
      limit = "100"
    } = req.query;

    // Calculate time filter
    let timeFilter = new Date();
    switch (timeRange) {
      case "1h":
        timeFilter = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case "24h":
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        timeFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Build where clause
    const whereClause: any = {
      server: {
        workspaceGroupId: workspaceId
      },
      timestamp: {
        gte: timeFilter
      }
    };

    if (serverId && serverId !== "") {
      whereClause.serverId = serverId as string;
    }

    if (flaggedOnly === "true") {
      whereClause.flagged = true;
    }

    if (filterUserId && filterUserId !== "") {
      whereClause.userId = BigInt(filterUserId as string);
    }

    if (search && search !== "") {
      whereClause.OR = [
        {
          message: {
            contains: search as string,
            mode: "insensitive"
          }
        },
        {
          username: {
            contains: search as string,
            mode: "insensitive"
          }
        }
      ];
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        server: {
          select: {
            name: true
          }
        },
        moderator: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      take: parseInt(limit as string)
    });

    // Format messages for response
    const formattedMessages = messages.map(message => ({
      id: message.id,
      serverId: message.serverId,
      serverName: message.server.name,
      userId: message.userId.toString(),
      username: message.username,
      message: message.message,
      filtered: message.filtered,
      flagged: message.flagged,
      timestamp: message.timestamp.toISOString(),
      moderatedBy: message.moderator?.username
    }));

    return res.status(200).json({
      messages: formattedMessages
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return res.status(500).json({ error: "Failed to fetch chat messages" });
  }
}