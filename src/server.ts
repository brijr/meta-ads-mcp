#!/usr/bin/env node

/**
 * Refactored Meta Marketing API MCP Server
 * Clean, simple architecture with proper separation of concerns
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MetaApiClient } from "./meta-client.js";
import { AuthManager } from "./utils/auth.js";
import { ToolFactory } from "./utils/tool-factory.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

// Tool registrations
import { registerCampaignTools } from "./tools/campaigns.js";
import { registerAnalyticsTools } from "./tools/analytics.js";
import { registerAudienceTools } from "./tools/audiences.js";
import { registerCreativeTools } from "./tools/creatives.js";
import { registerOAuthTools } from "./tools/oauth.js";
import { registerSystemTools } from "./tools/system.js";

// Resource registrations
import { registerCampaignResources } from "./resources/campaigns.js";
import { registerInsightsResources } from "./resources/insights.js";
import { registerAudienceResources } from "./resources/audiences.js";

export class MetaMcpServer {
  private server: McpServer;
  private metaClient!: MetaApiClient;
  private auth!: AuthManager;
  private toolFactory: ToolFactory;

  constructor() {
    const serverConfig = config.getServer();
    
    this.server = new McpServer({
      name: serverConfig.name,
      version: serverConfig.version,
    });
    
    this.toolFactory = new ToolFactory(this.server);
  }

  async initialize(): Promise<void> {
    logger.startup("🚀 Starting Meta Marketing API MCP Server...");
    
    // Initialize authentication
    await this.initializeAuth();
    
    // Initialize Meta API client
    this.initializeApiClient();
    
    // Register tools and resources
    this.registerToolsAndResources();
    
    logger.startup("✅ Meta Marketing API MCP Server initialized successfully");
  }

  private async initializeAuth(): Promise<void> {
    logger.startup("🔐 Initializing authentication...");
    
    try {
      this.auth = AuthManager.fromEnvironment();
      logger.startup("✅ Auth manager created successfully");

      // Validate and refresh token
      logger.startup("🔍 Validating Meta access token...");
      const currentToken = await this.auth.refreshTokenIfNeeded();
      logger.startup("✅ Token validation and refresh successful");
      logger.startup(`🔑 Token ready: ${currentToken.substring(0, 20)}...`);

      // Log OAuth configuration status
      const metaConfig = config.getMeta();
      const hasOAuthConfig = !!(metaConfig.appId && metaConfig.appSecret);
      logger.startup(`🔧 OAuth configuration: ${hasOAuthConfig ? "Available" : "Not configured"}`);
      logger.startup(`🔄 Auto-refresh: ${metaConfig.autoRefresh ? "Enabled" : "Disabled"}`);
    } catch (error) {
      logger.error("❌ Token validation failed:", error);
      logger.startup("💡 Use OAuth tools to obtain a new token or check configuration");
      process.exit(1);
    }
  }

  private initializeApiClient(): void {
    logger.startup("🌐 Initializing Meta API client...");
    this.metaClient = new MetaApiClient(this.auth);
    logger.startup("✅ Meta API client created successfully");
  }

  private registerToolsAndResources(): void {
    logger.startup("🛠️  Registering tools...");
    
    // Register all tool categories
    registerSystemTools(this.toolFactory, this.metaClient);
    registerCampaignTools(this.server, this.metaClient);
    registerAnalyticsTools(this.server, this.metaClient);
    registerAudienceTools(this.server, this.metaClient);
    registerCreativeTools(this.server, this.metaClient);
    registerOAuthTools(this.server, this.auth);
    
    logger.startup("   ✅ All tools registered");

    logger.startup("📚 Registering resources...");
    
    // Register all resource categories
    registerCampaignResources(this.server, this.metaClient);
    registerInsightsResources(this.server, this.metaClient);
    registerAudienceResources(this.server, this.metaClient);
    
    logger.startup("   ✅ All resources registered");
  }

  async start(): Promise<void> {
    const serverConfig = config.getServer();
    
    logger.startup("🔗 Connecting to MCP transport...");
    logger.startup(`📊 Server: ${serverConfig.name} v${serverConfig.version}`);
    logger.startup(`🔧 Meta API Version: ${config.getApiVersion()}`);

    try {
      logger.startup("🚀 Attempting server connection...");
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.startup("✅ Transport connection established");

      logger.startup("✅ Meta Marketing API MCP Server started successfully");
      logger.startup("🎯 Ready to receive requests from MCP clients");
      logger.startup("🔄 Server is now running and listening...");
    } catch (error) {
      logger.error("❌ Failed to connect transport:", error);
      process.exit(1);
    }
  }

  setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      process.exit(0);
    };

    const errorHandler = (error: any, context: string) => {
      logger.error(`${context}:`, error);
      process.exit(1);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("uncaughtException", (error) => errorHandler(error, "Uncaught Exception"));
    process.on("unhandledRejection", (reason, promise) => {
      errorHandler({ reason, promise }, "Unhandled Rejection");
    });
  }
}

// Main execution
async function main() {
  try {
    const server = new MetaMcpServer();
    server.setupGracefulShutdown();
    
    await server.initialize();
    await server.start();
  } catch (error) {
    logger.error("❌ Failed to start Meta Marketing API MCP Server:", error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});