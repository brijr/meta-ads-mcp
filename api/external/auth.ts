import { NextApiRequest, NextApiResponse } from "next";
import { SessionManager } from "../../src/services/session-manager.js";
import { UserAuthManager } from "../../src/utils/user-auth.js";
import { logger } from "../../src/utils/logger.js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sessionManager = SessionManager.getInstance();

  switch (req.method) {
    case "POST":
      return handleAuthStart(req, res);
    case "GET":
      return handleAuthCallback(req, res);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

/**
 * POST /api/external/auth
 * Start OAuth flow for external app
 */
async function handleAuthStart(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { redirectUri, state: externalState } = req.body;

    if (!redirectUri) {
      return res.status(400).json({ error: "redirectUri is required" });
    }

    // Generate OAuth state for CSRF protection
    const internalState = await UserAuthManager.generateOAuthState();

    // Store external state mapping if provided
    if (externalState) {
      // You might want to store this mapping in your storage system
      logger.debug(`External state provided: ${externalState}`);
    }

    // Generate Meta OAuth URL
    const authUrl = UserAuthManager.generateMetaOAuthUrl(internalState);

    res.status(200).json({
      success: true,
      authUrl,
      state: internalState,
      message: "Direct user to authUrl to begin OAuth flow",
    });
  } catch (error) {
    logger.error("OAuth start error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start OAuth flow",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/external/auth?code=...&state=...
 * Handle OAuth callback and create user session
 */
async function handleAuthCallback(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: "Missing code or state parameter" });
    }

    // Exchange code for tokens
    const tokens = await UserAuthManager.exchangeCodeForTokens(code as string);

    // Get user info from Meta
    const userInfo = await UserAuthManager.getMetaUserInfo(tokens.accessToken);

    // Create user session with available accounts
    const sessionManager = SessionManager.getInstance();
    const userSession = await sessionManager.createUserSession(
      userInfo.id,
      userInfo.email,
      userInfo.name,
      userInfo.id,
      tokens.accessToken,
      tokens.refreshToken
    );

    res.status(200).json({
      success: true,
      session: {
        sessionId: userSession.sessionId,
        userId: userSession.userId,
        email: userSession.email,
        name: userSession.name,
        availableAccounts: userSession.availableAccounts,
      },
      message: "Authentication successful",
    });
  } catch (error) {
    logger.error("OAuth callback error:", error);
    res.status(500).json({
      success: false,
      error: "OAuth callback failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
