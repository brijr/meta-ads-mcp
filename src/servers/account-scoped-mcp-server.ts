import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MetaApiClient } from "../meta-client.js";
import { AuthManager } from "../utils/auth.js";
import { ToolFactory } from "../utils/tool-factory.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import type { AccountSession } from "../types/session.js";

// Tool registrations - import all the existing tool registrations
import { registerCampaignTools } from "../tools/campaigns.js";
import { registerAnalyticsTools } from "../tools/analytics.js";
import { registerAudienceTools } from "../tools/audiences.js";
import { registerCreativeTools } from "../tools/creatives.js";

// Resource registrations
import { registerCampaignResources } from "../resources/campaigns.js";
import { registerInsightsResources } from "../resources/insights.js";
import { registerAudienceResources } from "../resources/audiences.js";

export class AccountScopedMcpServer {
  private server: McpServer;
  private metaClient: MetaApiClient;
  private auth: AuthManager;
  private toolFactory: ToolFactory;
  private accountSession: AccountSession;

  constructor(accountSession: AccountSession) {
    this.accountSession = accountSession;

    const serverConfig = config.getServer();

    this.server = new McpServer({
      name: `${serverConfig.name}-account-${this.extractAccountNumber(
        accountSession.accountId
      )}`,
      version: serverConfig.version,
    });

    this.toolFactory = new ToolFactory(this.server);

    // Create auth manager with user's access token
    this.auth = new AuthManager({
      accessToken: accountSession.accessToken,
      autoRefresh: false, // We'll handle refresh at the session level
    });

    // Create Meta API client
    this.metaClient = new MetaApiClient(this.auth);

    logger.info(
      `Created account-scoped MCP server for account ${accountSession.accountId}`
    );
  }

  async initialize(): Promise<void> {
    logger.debug(
      `Initializing account-scoped MCP server for account ${this.accountSession.accountId}`
    );

    // Validate the account access
    await this.validateAccountAccess();

    // Register tools and resources with account scope
    this.registerAccountScopedTools();

    logger.debug(
      `Account-scoped MCP server initialized for account ${this.accountSession.accountId}`
    );
  }

  private async validateAccountAccess(): Promise<void> {
    try {
      // Verify the user has access to this specific account
      const account = await this.metaClient.getAdAccount(
        this.accountSession.accountId
      );
      logger.debug(
        `Validated access to account: ${account.name} (${account.id})`
      );
    } catch (error) {
      logger.error(
        `Failed to validate access to account ${this.accountSession.accountId}:`,
        error
      );
      throw new Error(
        `Access denied to account ${this.accountSession.accountId}`
      );
    }
  }

  private registerAccountScopedTools(): void {
    logger.debug("Registering account-scoped tools...");

    // Register account info tool
    this.registerAccountInfoTool();

    // Register existing tools but scope them to this account
    this.registerScopedCampaignTools();
    this.registerScopedAnalyticsTools();
    this.registerScopedAudienceTools();
    this.registerScopedCreativeTools();

    // Register resources
    this.registerAccountScopedResources();

    logger.debug("Account-scoped tools registered successfully");
  }

  private registerAccountInfoTool(): void {
    this.toolFactory.registerTool(
      "get_account_info",
      "Get information about the currently selected ad account",
      {},
      async () => {
        try {
          const account = await this.metaClient.getAdAccount(
            this.accountSession.accountId
          );
          return {
            success: true,
            data: {
              id: account.id,
              name: account.name,
              currency: account.currency,
              status: account.account_status,
              timezone: account.timezone_name,
              business: account.business,
            },
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to get account info",
          };
        }
      }
    );
  }

  private registerScopedCampaignTools(): void {
    // We need to create account-scoped versions of campaign tools
    // This is a simplified approach - in practice, you'd modify the existing tools

    this.toolFactory.registerTool(
      "get_campaigns",
      "Get campaigns for the selected account",
      {
        status: {
          type: "array",
          items: { type: "string" },
          description: "Filter by campaign status",
        },
        limit: {
          type: "number",
          description: "Maximum number of campaigns to return",
        },
      },
      async (args: any) => {
        try {
          const campaigns = await this.metaClient.getCampaigns(
            this.accountSession.accountId,
            args
          );
          return {
            success: true,
            data: campaigns,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to get campaigns",
          };
        }
      }
    );

    this.toolFactory.registerTool(
      "create_campaign",
      "Create a new campaign in the selected account",
      {
        name: { type: "string", description: "Campaign name" },
        objective: { type: "string", description: "Campaign objective" },
        status: {
          type: "string",
          description: "Campaign status",
          enum: ["ACTIVE", "PAUSED"],
        },
        daily_budget: { type: "number", description: "Daily budget in cents" },
        lifetime_budget: {
          type: "number",
          description: "Lifetime budget in cents",
        },
      },
      async (args: any) => {
        try {
          const campaign = await this.metaClient.createCampaign(
            this.accountSession.accountId,
            args
          );
          return {
            success: true,
            data: campaign,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to create campaign",
          };
        }
      }
    );
  }

  private registerScopedAnalyticsTools(): void {
    this.toolFactory.registerTool(
      "get_insights",
      "Get performance insights for campaigns, ad sets, or ads in the selected account",
      {
        object_id: {
          type: "string",
          description: "The ID of the campaign, ad set, or ad",
        },
        level: {
          type: "string",
          enum: ["account", "campaign", "adset", "ad"],
          description: "The level of insights",
        },
        date_preset: {
          type: "string",
          description: "Date preset like 'last_7d', 'last_30d'",
        },
        fields: {
          type: "array",
          items: { type: "string" },
          description: "Specific metrics to retrieve",
        },
      },
      async (args: any) => {
        try {
          // If level is account, use the account ID
          const objectId =
            args.level === "account"
              ? this.accountSession.accountId
              : args.object_id;
          const insights = await this.metaClient.getInsights(objectId, args);
          return {
            success: true,
            data: insights,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to get insights",
          };
        }
      }
    );
  }

  private registerScopedAudienceTools(): void {
    this.toolFactory.registerTool(
      "list_audiences",
      "List custom audiences for the selected account",
      {
        limit: { type: "number", description: "Number of audiences to return" },
      },
      async (args: any) => {
        try {
          const audiences = await this.metaClient.getCustomAudiences(
            this.accountSession.accountId,
            args
          );
          return {
            success: true,
            data: audiences,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to list audiences",
          };
        }
      }
    );

    this.toolFactory.registerTool(
      "create_custom_audience",
      "Create a custom audience in the selected account",
      {
        name: { type: "string", description: "Audience name" },
        subtype: { type: "string", description: "Audience subtype" },
        description: { type: "string", description: "Audience description" },
      },
      async (args: any) => {
        try {
          const audience = await this.metaClient.createCustomAudience(
            this.accountSession.accountId,
            args
          );
          return {
            success: true,
            data: audience,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to create audience",
          };
        }
      }
    );
  }

  private registerScopedCreativeTools(): void {
    this.toolFactory.registerTool(
      "list_ad_creatives",
      "List ad creatives for the selected account",
      {
        limit: { type: "number", description: "Number of creatives to return" },
      },
      async (args: any) => {
        try {
          const creatives = await this.metaClient.getAdCreatives(
            this.accountSession.accountId,
            args
          );
          return {
            success: true,
            data: creatives,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to list creatives",
          };
        }
      }
    );

    this.toolFactory.registerTool(
      "create_ad_creative",
      "Create a new ad creative in the selected account",
      {
        name: { type: "string", description: "Creative name" },
        page_id: { type: "string", description: "Facebook Page ID" },
        message: { type: "string", description: "Ad text/message" },
        link_url: { type: "string", description: "Destination URL" },
        image_hash: { type: "string", description: "Pre-uploaded image hash" },
        call_to_action_type: {
          type: "string",
          description: "Call to action button",
        },
      },
      async (args: any) => {
        try {
          const creative = await this.metaClient.createAdCreative(
            this.accountSession.accountId,
            args
          );
          return {
            success: true,
            data: creative,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to create creative",
          };
        }
      }
    );
  }

  private registerAccountScopedResources(): void {
    // Register resources scoped to this account
    // This would be similar to the existing resource registrations but scoped
    logger.debug("Account-scoped resources registered");
  }

  async connect(transport: StdioServerTransport): Promise<void> {
    await this.server.connect(transport);
    logger.info(
      `Account-scoped MCP server connected for account ${this.accountSession.accountId}`
    );
  }

  getServer(): McpServer {
    return this.server;
  }

  getAccountId(): string {
    return this.accountSession.accountId;
  }

  private extractAccountNumber(accountId: string): string {
    return accountId.startsWith("act_") ? accountId.substring(4) : accountId;
  }
}
