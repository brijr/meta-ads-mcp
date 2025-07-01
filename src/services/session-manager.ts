import { randomBytes } from "crypto";
import { UserAuthManager } from "../utils/user-auth.js";
import { AuthManager } from "../utils/auth.js";
import { MetaApiClient } from "../meta-client.js";
import { logger } from "../utils/logger.js";
import type {
  UserSession,
  AccountInfo,
  AccountSession,
  McpServerInstance,
} from "../types/session.js";

interface StorageAdapter {
  set(key: string, value: any, options?: { ex?: number }): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  del(key: string): Promise<void>;
}

export class SessionManager {
  private static instance: SessionManager;
  private storage: StorageAdapter;
  private mcpInstances: Map<string, McpServerInstance> = new Map();

  private constructor() {
    this.storage = this.createStorageAdapter();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private createStorageAdapter(): StorageAdapter {
    // Use the same storage logic as UserAuthManager
    if (process.env.REDIS_URL) {
      return this.createRedisAdapter();
    } else if (process.env.KV_REST_API_URL) {
      return this.createVercelKVAdapter();
    } else {
      // Fallback to in-memory storage for development
      return this.createMemoryAdapter();
    }
  }

  private createRedisAdapter(): StorageAdapter {
    // Import Redis dynamically
    let client: any = null;
    let isConnected = false;

    const ensureConnected = async () => {
      if (!client) {
        const { createClient } = await import("redis");
        client = createClient({ url: process.env.REDIS_URL });
        await client.connect();
        isConnected = true;
      }
    };

    return {
      async set(key: string, value: any, options?: { ex?: number }) {
        await ensureConnected();
        const serialized = JSON.stringify(value);
        if (options?.ex) {
          await client.setEx(key, options.ex, serialized);
        } else {
          await client.set(key, serialized);
        }
      },
      async get<T>(key: string): Promise<T | null> {
        await ensureConnected();
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
      },
      async del(key: string) {
        await ensureConnected();
        await client.del(key);
      },
    };
  }

  private createVercelKVAdapter(): StorageAdapter {
    let kv: any = null;

    const ensureKV = async () => {
      if (!kv) {
        const kvModule = await import("@vercel/kv");
        kv = kvModule.kv;
      }
    };

    return {
      async set(key: string, value: any, options?: { ex?: number }) {
        await ensureKV();
        await kv.set(key, value, options);
      },
      async get<T>(key: string): Promise<T | null> {
        await ensureKV();
        return (await kv.get(key)) as T | null;
      },
      async del(key: string) {
        await ensureKV();
        await kv.del(key);
      },
    };
  }

  private createMemoryAdapter(): StorageAdapter {
    const memory = new Map<string, { value: any; expiry?: number }>();

    return {
      async set(key: string, value: any, options?: { ex?: number }) {
        const expiry = options?.ex ? Date.now() + options.ex * 1000 : undefined;
        memory.set(key, { value, expiry });
      },
      async get<T>(key: string): Promise<T | null> {
        const item = memory.get(key);
        if (!item) return null;
        if (item.expiry && Date.now() > item.expiry) {
          memory.delete(key);
          return null;
        }
        return item.value as T;
      },
      async del(key: string) {
        memory.delete(key);
      },
    };
  }

  /**
   * Create a new user session after OAuth authentication
   */
  async createUserSession(
    userId: string,
    email: string,
    name: string,
    metaUserId: string,
    accessToken: string,
    refreshToken?: string
  ): Promise<UserSession> {
    const sessionId = this.generateSessionId();

    // Get available accounts for the user
    const authManager = new AuthManager({ accessToken });
    const metaClient = new MetaApiClient(authManager);
    const accounts = await metaClient.getAdAccounts();

    const availableAccounts: AccountInfo[] = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      currency: account.currency,
      status: account.account_status,
      business: account.business
        ? {
            id: account.business.id,
            name: account.business.name,
          }
        : undefined,
    }));

    const session: UserSession = {
      sessionId,
      userId,
      email,
      name,
      metaUserId,
      accessToken,
      refreshToken,
      availableAccounts,
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    await this.storage.set(`session:${sessionId}`, session, {
      ex: 7 * 24 * 60 * 60,
    }); // 7 days
    await this.storage.set(`user:${userId}:session`, sessionId, {
      ex: 7 * 24 * 60 * 60,
    });

    logger.info(
      `Created user session for ${email} with ${availableAccounts.length} accounts`
    );
    return session;
  }

  /**
   * Get user session by session ID
   */
  async getUserSession(sessionId: string): Promise<UserSession | null> {
    const session = await this.storage.get<UserSession>(`session:${sessionId}`);
    if (session) {
      // Update last used
      session.lastUsed = new Date();
      await this.storage.set(`session:${sessionId}`, session, {
        ex: 7 * 24 * 60 * 60,
      });
    }
    return session;
  }

  /**
   * Select an account for a user session
   */
  async selectAccount(
    sessionId: string,
    accountId: string
  ): Promise<AccountSession | null> {
    const userSession = await this.getUserSession(sessionId);
    if (!userSession) {
      throw new Error("Session not found");
    }

    // Verify the account is available to this user
    const accountExists = userSession.availableAccounts.some(
      (acc) => acc.id === accountId
    );
    if (!accountExists) {
      throw new Error("Account not accessible to this user");
    }

    // Update user session with selected account
    userSession.selectedAccountId = accountId;
    userSession.lastUsed = new Date();
    await this.storage.set(`session:${sessionId}`, userSession, {
      ex: 7 * 24 * 60 * 60,
    });

    // Create account-specific session
    const accountSession: AccountSession = {
      sessionId,
      userId: userSession.userId,
      accountId,
      accessToken: userSession.accessToken,
      refreshToken: userSession.refreshToken,
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    await this.storage.set(
      `account_session:${sessionId}:${accountId}`,
      accountSession,
      { ex: 7 * 24 * 60 * 60 }
    );

    logger.info(`Account ${accountId} selected for session ${sessionId}`);
    return accountSession;
  }

  /**
   * Get account session
   */
  async getAccountSession(
    sessionId: string,
    accountId: string
  ): Promise<AccountSession | null> {
    const accountSession = await this.storage.get<AccountSession>(
      `account_session:${sessionId}:${accountId}`
    );
    if (accountSession) {
      // Update last used
      accountSession.lastUsed = new Date();
      await this.storage.set(
        `account_session:${sessionId}:${accountId}`,
        accountSession,
        { ex: 7 * 24 * 60 * 60 }
      );
    }
    return accountSession;
  }

  /**
   * Create or get MCP server instance for a specific account session
   */
  async getOrCreateMcpInstance(
    sessionId: string,
    accountId: string
  ): Promise<McpServerInstance> {
    const instanceKey = `${sessionId}:${accountId}`;

    // Check if instance already exists
    if (this.mcpInstances.has(instanceKey)) {
      const instance = this.mcpInstances.get(instanceKey)!;
      instance.lastUsed = new Date();
      return instance;
    }

    // Get account session
    const accountSession = await this.getAccountSession(sessionId, accountId);
    if (!accountSession) {
      throw new Error("Account session not found");
    }

    // Create new MCP server instance (we'll implement this)
    const mcpInstance: McpServerInstance = {
      sessionId,
      accountId,
      server: null, // Will be created by AccountScopedMcpServer
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    this.mcpInstances.set(instanceKey, mcpInstance);
    logger.info(
      `Created MCP instance for session ${sessionId}, account ${accountId}`
    );

    return mcpInstance;
  }

  /**
   * Clean up expired sessions and instances
   */
  async cleanupExpiredSessions(): Promise<void> {
    // This would be called periodically to clean up expired sessions
    // Implementation depends on storage backend
  }

  /**
   * Revoke a session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const userSession = await this.getUserSession(sessionId);
    if (userSession) {
      // Clean up all related data
      await this.storage.del(`session:${sessionId}`);
      await this.storage.del(`user:${userSession.userId}:session`);

      // Clean up account sessions
      for (const account of userSession.availableAccounts) {
        await this.storage.del(`account_session:${sessionId}:${account.id}`);
      }

      // Clean up MCP instances
      const toRemove: string[] = [];
      for (const [key, instance] of this.mcpInstances) {
        if (instance.sessionId === sessionId) {
          toRemove.push(key);
        }
      }
      toRemove.forEach((key) => this.mcpInstances.delete(key));

      logger.info(`Revoked session ${sessionId}`);
    }
  }

  private generateSessionId(): string {
    return randomBytes(32).toString("hex");
  }
}
