import { NextApiRequest, NextApiResponse } from "next";
import { SessionManager } from "../../src/services/session-manager.js";
import { logger } from "../../src/utils/logger.js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sessionManager = SessionManager.getInstance();

  switch (req.method) {
    case "GET":
      return handleGetAccounts(req, res, sessionManager);
    case "POST":
      return handleSelectAccount(req, res, sessionManager);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

/**
 * GET /api/external/accounts?sessionId=...
 * Get available accounts for a user session
 */
async function handleGetAccounts(
  req: NextApiRequest,
  res: NextApiResponse,
  sessionManager: SessionManager
) {
  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const userSession = await sessionManager.getUserSession(sessionId);
    if (!userSession) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: userSession.userId,
        email: userSession.email,
        selectedAccountId: userSession.selectedAccountId,
        availableAccounts: userSession.availableAccounts,
      },
    });
  } catch (error) {
    logger.error("Get accounts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get accounts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * POST /api/external/accounts
 * Select an account for a user session
 */
async function handleSelectAccount(
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

    const accountSession = await sessionManager.selectAccount(
      sessionId,
      accountId
    );
    if (!accountSession) {
      return res.status(400).json({ error: "Failed to select account" });
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: accountSession.sessionId,
        accountId: accountSession.accountId,
        userId: accountSession.userId,
        message: "Account selected successfully",
      },
    });
  } catch (error) {
    logger.error("Select account error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to select account",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
