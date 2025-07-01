import { NextApiRequest, NextApiResponse } from "next";
import { SessionManager } from "../../src/services/session-manager.js";
import { AccountScopedMcpServer } from "../../src/servers/account-scoped-mcp-server.js";
import { logger } from "../../src/utils/logger.js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sessionManager = SessionManager.getInstance();

  switch (req.method) {
    case "POST":
      return handleCreateMcpConnection(req, res, sessionManager);
    case "GET":
      return handleGetMcpConnection(req, res, sessionManager);
    case "DELETE":
      return handleRevokeMcpConnection(req, res, sessionManager);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

/**
 * POST /api/external/mcp
 * Create or get MCP connection for a specific account session
 */
async function handleCreateMcpConnection(
  req: NextApiRequest,
  res: NextApiResponse,
  sessionManager: SessionManager
) {
  try {
    const { sessionId, accountId } = req.body;

    if (!sessionId || !accountId) {
      return res
        .status(400)
        .json({ error: "sessionId and accountId are required" });
    }

    // Verify account session exists
    const accountSession = await sessionManager.getAccountSession(
      sessionId,
      accountId
    );
    if (!accountSession) {
      return res
        .status(404)
        .json({ error: "Account session not found. Select an account first." });
    }

    // Get or create MCP instance
    const mcpInstance = await sessionManager.getOrCreateMcpInstance(
      sessionId,
      accountId
    );

    // If server instance doesn't exist, create it
    if (!mcpInstance.server) {
      const accountScopedServer = new AccountScopedMcpServer(accountSession);
      await accountScopedServer.initialize();
      mcpInstance.server = accountScopedServer;
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        accountId,
        mcpServerName: mcpInstance.server.getServer().name,
        connectionInfo: {
          type: "stdio",
          // In a real implementation, you might provide WebSocket endpoints or other connection methods
          instructions:
            "Use this MCP server instance for account-specific operations",
        },
        createdAt: mcpInstance.createdAt,
        lastUsed: mcpInstance.lastUsed,
      },
    });
  } catch (error) {
    logger.error("Create MCP connection error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create MCP connection",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/external/mcp?sessionId=...&accountId=...
 * Get existing MCP connection info
 */
async function handleGetMcpConnection(
  req: NextApiRequest,
  res: NextApiResponse,
  sessionManager: SessionManager
) {
  try {
    const { sessionId, accountId } = req.query;

    if (
      !sessionId ||
      !accountId ||
      typeof sessionId !== "string" ||
      typeof accountId !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "sessionId and accountId are required" });
    }

    const mcpInstance = await sessionManager.getOrCreateMcpInstance(
      sessionId,
      accountId
    );

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        accountId,
        exists: !!mcpInstance.server,
        createdAt: mcpInstance.createdAt,
        lastUsed: mcpInstance.lastUsed,
      },
    });
  } catch (error) {
    logger.error("Get MCP connection error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get MCP connection",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * DELETE /api/external/mcp
 * Revoke session and cleanup MCP connections
 */
async function handleRevokeMcpConnection(
  req: NextApiRequest,
  res: NextApiResponse,
  sessionManager: SessionManager
) {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    await sessionManager.revokeSession(sessionId);

    res.status(200).json({
      success: true,
      message: "Session revoked and MCP connections cleaned up",
    });
  } catch (error) {
    logger.error("Revoke MCP connection error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to revoke MCP connection",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
