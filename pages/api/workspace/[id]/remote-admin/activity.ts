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
      return await handleGetActivity(req, res, workspaceId);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Activity API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetActivity(req: NextApiRequest, res: NextApiResponse, workspaceId: number) {
  try {
    const {
      limit = "50",
      serverId,
      eventType,
      userId: filterUserId,
      search,
      includeChatMessages = "true"
    } = req.query;

    // Get all events from game_events table
    const gameEventsWhere: any = {
      server: {
        workspaceGroupId: workspaceId
      }
    };

    if (serverId && serverId !== "") {
      gameEventsWhere.serverId = serverId as string;
    }

    if (eventType && eventType !== "" && eventType !== "chat_message") {
      gameEventsWhere.eventType = eventType as string;
    }

    if (filterUserId && filterUserId !== "") {
      gameEventsWhere.userId = BigInt(filterUserId as string);
    }

    if (search && search !== "") {
      gameEventsWhere.OR = [
        {
          username: {
            contains: search as string,
            mode: "insensitive"
          }
        },
        {
          eventType: {
            contains: search as string,
            mode: "insensitive"
          }
        }
      ];
    }

    const gameEvents = await prisma.gameEvent.findMany({
      where: gameEventsWhere,
      include: {
        server: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      take: parseInt(limit as string)
    });

    // Get chat messages if included
    let chatMessages: any[] = [];
    if (includeChatMessages === "true" && (!eventType || eventType === "chat_message")) {
      const chatWhere: any = {
        server: {
          workspaceGroupId: workspaceId
        }
      };

      if (serverId && serverId !== "") {
        chatWhere.serverId = serverId as string;
      }

      if (filterUserId && filterUserId !== "") {
        chatWhere.userId = BigInt(filterUserId as string);
      }

      if (search && search !== "") {
        chatWhere.OR = [
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

      chatMessages = await prisma.chatMessage.findMany({
        where: chatWhere,
        include: {
          server: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          timestamp: "desc"
        },
        take: parseInt(limit as string)
      });
    }

    // Get player actions
    const playerActionsWhere: any = {
      server: {
        workspaceGroupId: workspaceId
      }
    };

    if (serverId && serverId !== "") {
      playerActionsWhere.serverId = serverId as string;
    }

    if (eventType && eventType !== "" && eventType === "player_action") {
      // Include all player actions
    } else if (eventType && eventType !== "player_action") {
      // Don't include player actions if a different specific type is requested
      playerActionsWhere.id = "never_match";
    }

    if (filterUserId && filterUserId !== "") {
      playerActionsWhere.userId = BigInt(filterUserId as string);
    }

    if (search && search !== "") {
      playerActionsWhere.OR = [
        {
          username: {
            contains: search as string,
            mode: "insensitive"
          }
        },
        {
          actionType: {
            contains: search as string,
            mode: "insensitive"
          }
        }
      ];
    }

    const playerActions = await prisma.playerAction.findMany({
      where: playerActionsWhere,
      include: {
        server: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      take: parseInt(limit as string)
    });

    // Combine and format all events
    const allEvents: any[] = [
      ...gameEvents.map(event => ({
        id: event.id,
        type: event.eventType === "join" ? "player_join" : event.eventType === "leave" ? "player_leave" : "game_event",
        serverId: event.serverId,
        serverName: event.server.name,
        userId: event.userId?.toString(),
        username: event.username,
        data: event.data,
        timestamp: event.timestamp.toISOString()
      })),
      ...chatMessages.map(message => ({
        id: message.id,
        type: "chat_message",
        serverId: message.serverId,
        serverName: message.server.name,
        userId: message.userId.toString(),
        username: message.username,
        message: message.message,
        data: {
          flagged: message.flagged,
          filtered: message.filtered
        },
        timestamp: message.timestamp.toISOString()
      })),
      ...playerActions.map(action => ({
        id: action.id,
        type: "player_action",
        serverId: action.serverId,
        serverName: action.server.name,
        userId: action.userId.toString(),
        username: action.username,
        data: {
          actionType: action.actionType,
          position: action.position,
          ...(action.data && typeof action.data === 'object' ? action.data : {})
        },
        timestamp: action.timestamp.toISOString()
      }))
    ];

    // Sort by timestamp (most recent first) and limit
    allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedEvents = allEvents.slice(0, parseInt(limit as string));

    return res.status(200).json({
      events: limitedEvents
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return res.status(500).json({ error: "Failed to fetch activity" });
  }
}