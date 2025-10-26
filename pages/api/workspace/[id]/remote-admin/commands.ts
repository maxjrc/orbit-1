import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { withPermissionCheck } from "@/utils/permissionsManager";

const prisma = new PrismaClient();

export default withPermissionCheck(handler, "admin");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const workspaceId = parseInt(id as string);

  if (!workspaceId || isNaN(workspaceId)) {
    return res.status(400).json({ error: "Invalid workspace ID" });
  }

  try {
    const userId = req.session.userid;
    const { command, serverId, targetUserId, parameters, priority = 1 } = req.body;

    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    // Validate server belongs to this workspace (if serverId specified)
    if (serverId) {
      const server = await prisma.gameServer.findFirst({
        where: {
          id: serverId,
          workspaceGroupId: workspaceId
        }
      });

      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
    }

    // Validate command type
    const validCommands = [
      "kick_player",
      "ban_player",
      "unban_player",
      "message_player",
      "broadcast_message",
      "server_shutdown",
      "server_restart",
      "give_admin",
      "remove_admin",
      "teleport_player",
      "change_gamemode"
    ];

    if (!validCommands.includes(command)) {
      return res.status(400).json({ error: "Invalid command type" });
    }

    // Additional validation based on command type
    if (["kick_player", "ban_player", "message_player", "give_admin", "remove_admin", "teleport_player"].includes(command)) {
      if (!targetUserId) {
        return res.status(400).json({ error: "Target user ID required for this command" });
      }
    }

    // Create the command in queue
    const queuedCommand = await prisma.serverCommandQueue.create({
      data: {
        serverId: serverId || null, // null = broadcast to all servers
        command,
        targetUserId: targetUserId ? BigInt(targetUserId) : null,
        parameters: parameters || null,
        executedBy: BigInt(userId),
        priority,
        status: "pending"
      },
      include: {
        executor: {
          select: {
            username: true
          }
        },
        server: {
          select: {
            name: true
          }
        }
      }
    });

    // Log the command execution for audit trail
    await prisma.gameEvent.create({
      data: {
        serverId: serverId || "broadcast",
        eventType: "admin_command",
        userId: BigInt(userId),
        username: queuedCommand.executor.username || "Unknown",
        data: {
          command,
          targetUserId,
          parameters,
          queueId: queuedCommand.id
        }
      }
    });

    return res.status(201).json({
      success: true,
      commandId: queuedCommand.id,
      message: `Command "${command}" queued successfully`,
      target: serverId ? queuedCommand.server?.name : "All servers",
      estimatedDelivery: "Within 30 seconds"
    });

  } catch (error) {
    console.error("Command execution error:", error);
    return res.status(500).json({ error: "Failed to execute command" });
  }
}