import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { withPermissionCheck } from "@/utils/permissionsManager";

const prisma = new PrismaClient();

export default withPermissionCheck(handler, "admin");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const workspaceId = parseInt(id as string);

  if (!workspaceId || isNaN(workspaceId)) {
    return res.status(400).json({ error: "Invalid workspace ID" });
  }

  try {
    // Get all queued commands for servers in this workspace
    const queuedCommands = await prisma.serverCommandQueue.findMany({
      where: {
        OR: [
          {
            server: {
              workspaceGroupId: workspaceId
            }
          },
          {
            serverId: null // Broadcast commands
          }
        ]
      },
      include: {
        executor: {
          select: {
            username: true
          }
        },
        server: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ],
      take: 100 // Limit to recent 100 commands
    });

    // Format commands for frontend
    const formattedCommands = queuedCommands.map(cmd => ({
      id: cmd.id,
      command: cmd.command,
      targetUserId: cmd.targetUserId?.toString(),
      parameters: cmd.parameters,
      status: cmd.status,
      priority: cmd.priority,
      createdAt: cmd.createdAt.toISOString(),
      deliveredAt: cmd.deliveredAt?.toISOString(),
      executor: {
        username: cmd.executor.username
      },
      server: cmd.server ? {
        id: cmd.server.id,
        name: cmd.server.name
      } : null
    }));

    return res.status(200).json({
      commands: formattedCommands,
      total: queuedCommands.length
    });

  } catch (error) {
    console.error("Queue fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch command queue" });
  }
}