import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { withPermissionCheck } from "@/utils/permissionsManager";
import fs from "fs";
import path from "path";

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
    // Get workspace info for the script configuration
    const workspace = await prisma.workspace.findUnique({
      where: { groupId: workspaceId },
      select: {
        groupId: true
      }
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Read the Roblox script file
    const scriptPath = path.join(process.cwd(), "Orbitb5-activity.rbxmx");

    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: "Roblox script file not found" });
    }

    const scriptContent = fs.readFileSync(scriptPath, "utf8");

    // Set headers for file download
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="Orbit-RemoteAdmin-${workspace.groupId}.rbxmx"`);

    // Send the script content
    res.status(200).send(scriptContent);

  } catch (error) {
    console.error("Script download error:", error);
    return res.status(500).json({ error: "Failed to download script" });
  }
}