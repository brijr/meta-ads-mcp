/**
 * Complete Example: External App Integration with Multi-Account Meta Ads MCP Server
 *
 * This example shows how to integrate your external application with the
 * Multi-Account Meta Ads MCP Server for per-user, per-account functionality.
 */

import express from "express";
import { useState } from "react";
import {
  ExternalAppClient,
  ExternalAppIntegration,
} from "../src/client/external-app-client.js";

// Example 1: Simple Express.js Integration
export class SimpleExpressIntegration {
  private app: express.Application;
  private mcpClient: ExternalAppClient;
  private userSessions: Map<string, any> = new Map();

  constructor() {
    this.app = express();
    this.mcpClient = new ExternalAppClient("http://localhost:3001");
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // Health check
    this.app.get("/health", async (req, res) => {
      try {
        const health = await this.mcpClient.healthCheck();
        res.json(health);
      } catch (error) {
        res.status(500).json({ error: "MCP server not available" });
      }
    });

    // Start Meta OAuth flow
    this.app.get("/auth/meta", async (req, res) => {
      try {
        const result = await this.mcpClient.startAuth(
          "http://localhost:3000/auth/meta/callback"
        );
        res.redirect(result.authUrl);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Handle OAuth callback
    this.app.get("/auth/meta/callback", async (req, res) => {
      try {
        const { code, state } = req.query as { code: string; state: string };
        const result = await this.mcpClient.handleAuthCallback(code, state);

        // Store session
        this.userSessions.set(result.session.sessionId, result.session);

        // Return session info and available accounts
        res.json({
          success: true,
          sessionId: result.session.sessionId,
          user: {
            email: result.session.email,
            name: result.session.name,
          },
          accounts: result.session.availableAccounts,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get user's accounts
    this.app.get("/api/accounts/:sessionId", async (req, res) => {
      try {
        const { sessionId } = req.params;
        const result = await this.mcpClient.getAccounts(sessionId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Select an account for chat
    this.app.post("/api/accounts/select", async (req, res) => {
      try {
        const { sessionId, accountId } = req.body;
        const result = await this.mcpClient.setupAccountMcp(
          sessionId,
          accountId
        );

        res.json({
          success: true,
          message: "Account selected successfully",
          mcpConnection: result.mcpConnection,
          chatReady: true,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get MCP connection info for chat interface
    this.app.get("/api/mcp/:sessionId/:accountId", async (req, res) => {
      try {
        const { sessionId, accountId } = req.params;
        const result = await this.mcpClient.getMcpConnection(
          sessionId,
          accountId
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Logout and cleanup
    this.app.post("/api/logout", async (req, res) => {
      try {
        const { sessionId } = req.body;
        await this.mcpClient.revokeSession(sessionId);
        this.userSessions.delete(sessionId);

        res.json({ success: true, message: "Logged out successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`External app server running on port ${port}`);
      console.log(`Visit http://localhost:${port}/auth/meta to start`);
    });
  }
}

// Example 2: Advanced Integration with State Management
export class AdvancedIntegration {
  private mcpIntegration: ExternalAppIntegration;
  private chatSessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.mcpIntegration = new ExternalAppIntegration("http://localhost:3001");
  }

  async authenticateUser(): Promise<string> {
    // Step 1: Start OAuth flow
    const authUrl = await this.mcpIntegration.initiateAuth(
      "http://localhost:3000/callback"
    );
    console.log("Direct user to:", authUrl);
    return authUrl;
  }

  async handleOAuthCallback(code: string, state: string): Promise<void> {
    // Step 2: Handle OAuth return and get accounts
    const accounts = await this.mcpIntegration.handleOAuthReturn(code, state);

    console.log("Available accounts:");
    accounts.forEach((account, index) => {
      console.log(
        `${index + 1}. ${account.name} (${account.id}) - ${account.currency}`
      );
    });
  }

  async selectAccountForChat(accountId: string): Promise<void> {
    // Step 3: Select account and setup MCP
    const mcpConnection = await this.mcpIntegration.selectAccount(accountId);

    // Create chat session
    const session = this.mcpIntegration.getCurrentSession()!;
    const chatSession = new ChatSession(
      session.sessionId,
      accountId,
      mcpConnection
    );
    this.chatSessions.set(`${session.sessionId}:${accountId}`, chatSession);

    console.log("Chat session ready for account:", accountId);
    console.log("MCP Connection:", mcpConnection);
  }

  getChatSession(
    sessionId: string,
    accountId: string
  ): ChatSession | undefined {
    return this.chatSessions.get(`${sessionId}:${accountId}`);
  }

  async cleanup(): Promise<void> {
    await this.mcpIntegration.logout();
    this.chatSessions.clear();
  }
}

// Example chat session handler
class ChatSession {
  constructor(
    public sessionId: string,
    public accountId: string,
    public mcpConnection: any
  ) {}

  async sendChatMessage(message: string): Promise<string> {
    // In a real implementation, this would interface with your chat system
    // and use the MCP connection to execute account-specific commands

    console.log(`Chat message for account ${this.accountId}: ${message}`);

    // Example: Parse message for MCP commands
    if (message.includes("campaigns")) {
      return `Here are the campaigns for account ${this.accountId}...`;
    }

    if (message.includes("create campaign")) {
      return `I'll help you create a campaign in account ${this.accountId}...`;
    }

    return `I'm ready to help with account ${this.accountId}. What would you like to do?`;
  }
}

// Example 3: React/Next.js Hook
export const useMetaAdsIntegration = () => {
  const [mcpClient] = useState(
    () => new ExternalAppClient("http://localhost:3001")
  );
  const [session, setSession] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [mcpConnection, setMcpConnection] = useState(null);

  const startAuth = async () => {
    try {
      const result = await mcpClient.startAuth(
        window.location.origin + "/auth/callback"
      );
      window.location.href = result.authUrl;
    } catch (error) {
      console.error("Auth failed:", error);
    }
  };

  const handleCallback = async (code: string, state: string) => {
    try {
      const result = await mcpClient.handleAuthCallback(code, state);
      setSession(result.session);
      setAccounts(result.session.availableAccounts);
    } catch (error) {
      console.error("Callback failed:", error);
    }
  };

  const selectAccount = async (accountId: string) => {
    try {
      const result = await mcpClient.setupAccountMcp(
        session.sessionId,
        accountId
      );
      setSelectedAccount(accountId);
      setMcpConnection(result.mcpConnection);
    } catch (error) {
      console.error("Account selection failed:", error);
    }
  };

  const logout = async () => {
    try {
      if (session) {
        await mcpClient.revokeSession(session.sessionId);
      }
      setSession(null);
      setAccounts([]);
      setSelectedAccount(null);
      setMcpConnection(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return {
    session,
    accounts,
    selectedAccount,
    mcpConnection,
    startAuth,
    handleCallback,
    selectAccount,
    logout,
  };
};

// Usage example
async function exampleUsage() {
  console.log("=== Multi-Account Meta Ads MCP Integration Example ===\n");

  // Start the MCP server first (in production, this would be a separate service)
  console.log(
    "1. Make sure the Multi-Account MCP Server is running on port 3001"
  );
  console.log("   npm run start:multi-account\n");

  // Initialize integration
  const integration = new AdvancedIntegration();

  try {
    // Step 1: Start authentication
    console.log("2. Starting OAuth flow...");
    const authUrl = await integration.authenticateUser();
    console.log(`   User should visit: ${authUrl}\n`);

    // Step 2: After user completes OAuth (you'd get these from callback)
    console.log("3. After OAuth completion, handle callback...");
    // const code = 'oauth_code_from_callback';
    // const state = 'oauth_state_from_callback';
    // await integration.handleOAuthCallback(code, state);

    // Step 3: Select account
    console.log("4. User selects an account...");
    // const selectedAccountId = 'act_123456789';
    // await integration.selectAccountForChat(selectedAccountId);

    console.log(
      "5. Chat session is ready! User can now chat with the selected account.\n"
    );
  } catch (error) {
    console.error("Integration example failed:", error);
  }
}

// Run the simple Express example
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new SimpleExpressIntegration();
  app.start(3000);
}
