/**
 * External App Client for Multi-Account Meta Ads MCP Server
 * This client library simplifies integration with external applications
 */

import type {
  UserSession,
  AccountInfo,
  AccountSession,
} from "../types/session.js";

export interface McpConnectionInfo {
  sessionId: string;
  accountId: string;
  mcpServerName: string;
  connectionInfo: {
    type: string;
    instructions: string;
  };
  createdAt: Date;
  lastUsed: Date;
}

export interface AuthStartResponse {
  success: boolean;
  authUrl: string;
  state: string;
  message: string;
}

export interface AuthCallbackResponse {
  success: boolean;
  session: {
    sessionId: string;
    userId: string;
    email: string;
    name: string;
    availableAccounts: AccountInfo[];
  };
  message: string;
}

export interface AccountsResponse {
  success: boolean;
  data: {
    userId: string;
    email: string;
    selectedAccountId?: string;
    availableAccounts: AccountInfo[];
  };
}

export interface SelectAccountResponse {
  success: boolean;
  data: {
    sessionId: string;
    accountId: string;
    userId: string;
    message: string;
  };
}

export interface McpConnectionResponse {
  success: boolean;
  data: McpConnectionInfo;
}

export class ExternalAppClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = "http://localhost:3001") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Step 1: Start OAuth flow for user authentication
   */
  async startAuth(
    redirectUri: string,
    externalState?: string
  ): Promise<AuthStartResponse> {
    const response = await fetch(`${this.baseUrl}/api/external/auth`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({
        redirectUri,
        state: externalState,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Auth start failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Step 2: Handle OAuth callback (usually called by your backend)
   */
  async handleAuthCallback(
    code: string,
    state: string
  ): Promise<AuthCallbackResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/external/auth?code=${code}&state=${state}`,
      {
        method: "GET",
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Auth callback failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Step 3: Get available accounts for a user session
   */
  async getAccounts(sessionId: string): Promise<AccountsResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/external/accounts?sessionId=${sessionId}`,
      {
        method: "GET",
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Get accounts failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Step 4: Select an account for the user session
   */
  async selectAccount(
    sessionId: string,
    accountId: string
  ): Promise<SelectAccountResponse> {
    const response = await fetch(`${this.baseUrl}/api/external/accounts`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({
        sessionId,
        accountId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Select account failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Step 5: Create MCP connection for the selected account
   */
  async createMcpConnection(
    sessionId: string,
    accountId: string
  ): Promise<McpConnectionResponse> {
    const response = await fetch(`${this.baseUrl}/api/external/mcp`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({
        sessionId,
        accountId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Create MCP connection failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Get existing MCP connection info
   */
  async getMcpConnection(
    sessionId: string,
    accountId: string
  ): Promise<McpConnectionResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/external/mcp?sessionId=${sessionId}&accountId=${accountId}`,
      {
        method: "GET",
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Get MCP connection failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Revoke session and cleanup all MCP connections
   */
  async revokeSession(
    sessionId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/external/mcp`, {
      method: "DELETE",
      headers: this.defaultHeaders,
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error(
        `Revoke session failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Get session information
   */
  async getSession(
    sessionId: string
  ): Promise<{ success: boolean; data: UserSession }> {
    const response = await fetch(
      `${this.baseUrl}/api/external/sessions/${sessionId}`,
      {
        method: "GET",
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Get session failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Convenience method: Complete authentication flow
   * Returns the user session with available accounts
   */
  async completeAuthFlow(
    code: string,
    state: string
  ): Promise<{
    session: AuthCallbackResponse["session"];
    accounts: AccountInfo[];
  }> {
    const authResult = await this.handleAuthCallback(code, state);

    return {
      session: authResult.session,
      accounts: authResult.session.availableAccounts,
    };
  }

  /**
   * Convenience method: Setup account-specific MCP
   * Selects account and creates MCP connection in one call
   */
  async setupAccountMcp(
    sessionId: string,
    accountId: string
  ): Promise<{
    accountSession: SelectAccountResponse["data"];
    mcpConnection: McpConnectionInfo;
  }> {
    const selectResult = await this.selectAccount(sessionId, accountId);
    const mcpResult = await this.createMcpConnection(sessionId, accountId);

    return {
      accountSession: selectResult.data,
      mcpConnection: mcpResult.data,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    timestamp: string;
  }> {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      throw new Error(
        `Health check failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }
}

// Example usage for external apps
export class ExternalAppIntegration {
  private client: ExternalAppClient;
  private currentSession: AuthCallbackResponse["session"] | null = null;
  private selectedAccount: string | null = null;

  constructor(mcpServerUrl: string = "http://localhost:3001") {
    this.client = new ExternalAppClient(mcpServerUrl);
  }

  /**
   * Step 1: Initiate OAuth flow
   */
  async initiateAuth(redirectUri: string): Promise<string> {
    const result = await this.client.startAuth(redirectUri);
    return result.authUrl; // Direct user to this URL
  }

  /**
   * Step 2: Handle OAuth return (in your app's callback endpoint)
   */
  async handleOAuthReturn(code: string, state: string): Promise<AccountInfo[]> {
    const result = await this.client.completeAuthFlow(code, state);
    this.currentSession = result.session;
    return result.accounts;
  }

  /**
   * Step 3: Let user select an account
   */
  async selectAccount(accountId: string): Promise<McpConnectionInfo> {
    if (!this.currentSession) {
      throw new Error("No active session. Complete authentication first.");
    }

    const result = await this.client.setupAccountMcp(
      this.currentSession.sessionId,
      accountId
    );
    this.selectedAccount = accountId;

    return result.mcpConnection;
  }

  /**
   * Get current session info
   */
  getCurrentSession(): AuthCallbackResponse["session"] | null {
    return this.currentSession;
  }

  /**
   * Get selected account ID
   */
  getSelectedAccount(): string | null {
    return this.selectedAccount;
  }

  /**
   * Clean up session
   */
  async logout(): Promise<void> {
    if (this.currentSession) {
      await this.client.revokeSession(this.currentSession.sessionId);
      this.currentSession = null;
      this.selectedAccount = null;
    }
  }
}
