export interface UserSession {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  metaUserId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiration?: Date;
  selectedAccountId?: string;
  availableAccounts: AccountInfo[];
  createdAt: Date;
  lastUsed: Date;
}

export interface AccountInfo {
  id: string;
  name: string;
  currency: string;
  status: string;
  business?: {
    id: string;
    name: string;
  };
}

export interface AccountSession {
  sessionId: string;
  userId: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface McpServerInstance {
  sessionId: string;
  accountId: string;
  server: any; // Will be the actual MCP server instance
  port?: number;
  wsEndpoint?: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface ExternalAppAuth {
  appId: string;
  appSecret: string;
  redirectUri: string;
  scopes: string[];
}
