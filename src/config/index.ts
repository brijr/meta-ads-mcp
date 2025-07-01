/**
 * Centralized configuration management for Meta Ads MCP Server
 */

export interface ServerConfig {
  // Meta API Configuration
  meta: {
    accessToken: string;
    appId?: string;
    appSecret?: string;
    businessId?: string;
    redirectUri?: string;
    refreshToken?: string;
    autoRefresh: boolean;
    apiVersion: string;
    apiTier: 'development' | 'standard';
    baseUrl: string;
  };
  
  // Server Configuration
  server: {
    name: string;
    version: string;
    nodeEnv: string;
    debug: boolean;
  };
  
  // Rate Limiting
  rateLimits: {
    development: {
      maxScore: number;
      decayTimeMs: number;
      blockTimeMs: number;
    };
    standard: {
      maxScore: number;
      decayTimeMs: number;
      blockTimeMs: number;
    };
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: ServerConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): ServerConfig {
    // Validate required environment variables
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('META_ACCESS_TOKEN environment variable is required');
    }

    return {
      meta: {
        accessToken,
        appId: process.env.META_APP_ID,
        appSecret: process.env.META_APP_SECRET,
        businessId: process.env.META_BUSINESS_ID,
        redirectUri: process.env.META_REDIRECT_URI,
        refreshToken: process.env.META_REFRESH_TOKEN,
        autoRefresh: process.env.META_AUTO_REFRESH === 'true',
        apiVersion: process.env.META_API_VERSION || 'v23.0',
        apiTier: (process.env.META_API_TIER as 'development' | 'standard') || 'standard',
        baseUrl: 'https://graph.facebook.com',
      },
      server: {
        name: process.env.MCP_SERVER_NAME || 'Meta Marketing API Server',
        version: process.env.MCP_SERVER_VERSION || '1.7.0',
        nodeEnv: process.env.NODE_ENV || 'production',
        debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',
      },
      rateLimits: {
        development: {
          maxScore: 60,
          decayTimeMs: 5 * 60 * 1000, // 5 minutes
          blockTimeMs: 5 * 60 * 1000, // 5 minutes
        },
        standard: {
          maxScore: 9000,
          decayTimeMs: 5 * 60 * 1000, // 5 minutes
          blockTimeMs: 1 * 60 * 1000, // 1 minute
        },
      },
    };
  }

  public getConfig(): ServerConfig {
    return this.config;
  }

  public getMeta() {
    return this.config.meta;
  }

  public getServer() {
    return this.config.server;
  }

  public getRateLimits() {
    return this.config.rateLimits;
  }

  public isDebugMode(): boolean {
    return this.config.server.debug;
  }

  public getApiVersion(): string {
    return this.config.meta.apiVersion;
  }

  public getBaseUrl(): string {
    return `${this.config.meta.baseUrl}/${this.config.meta.apiVersion}`;
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();