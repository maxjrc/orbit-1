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

    const { messageId, action } = req.body;

    if (!messageId || !action) {
      return res.status(400).json({ error: "Message ID and action are required" });
    }

    // Verify the message belongs to this workspace
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        server: {
          workspaceGroupId: workspaceId
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    switch (action) {
      case "flag":
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            flagged: true,
            moderatedBy: BigInt(userId)
          }
        });
        break;

      case "unflag":
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            flagged: false,
            moderatedBy: BigInt(userId)
          }
        });
        break;

      case "delete":
        await prisma.chatMessage.delete({
          where: { id: messageId }
        });
        break;

      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Chat moderation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}