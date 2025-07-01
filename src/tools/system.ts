/**
 * System-level tools extracted from main server file
 * Handles account management, health checks, capabilities, and AI guidance
 */

import { z } from "zod";
import { ToolFactory, createToolResponse } from "../utils/tool-factory.js";
import { ResponseFormatter } from "../utils/response-formatter.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import type { MetaApiClient } from "../meta-client.js";

export function registerSystemTools(toolFactory: ToolFactory, metaClient: MetaApiClient) {
  // Account discovery tool
  toolFactory.registerTool(
    "get_ad_accounts",
    "Get all accessible Meta ad accounts with their details, currencies, and business information",
    z.object({}),
    async () => {
      try {
        const accounts = await metaClient.getAdAccounts();

        const accountsData = accounts.map((account) => ({
          id: account.id,
          name: account.name,
          account_status: account.account_status,
          currency: account.currency,
          timezone_name: account.timezone_name,
          balance: account.balance,
          business: account.business
            ? {
                id: account.business.id,
                name: account.business.name,
              }
            : null,
        }));

        return createToolResponse.success(
          {
            accounts: accountsData,
            total_accounts: accountsData.length,
          },
          "Ad accounts retrieved successfully"
        );
      } catch (error) {
        return createToolResponse.error(
          error instanceof Error ? error.message : "Failed to retrieve ad accounts"
        );
      }
    }
  );

  // Health check tool
  toolFactory.registerTool(
    "health_check",
    "Check server health, Meta API connectivity, and authentication status",
    z.object({}),
    async () => {
      try {
        const accounts = await metaClient.getAdAccounts();
        const serverConfig = config.getServer();
        
        const healthData = {
          status: "healthy",
          server_name: serverConfig.name,
          version: serverConfig.version,
          timestamp: new Date().toISOString(),
          meta_api_connection: "connected",
          accessible_accounts: accounts.length,
          rate_limit_status: "operational",
          api_version: config.getApiVersion(),
          features: {
            campaign_management: true,
            analytics_reporting: true,
            audience_management: true,
            creative_management: true,
            real_time_insights: true,
          },
        };

        return createToolResponse.success(healthData);
      } catch (error) {
        const serverConfig = config.getServer();
        const errorData = {
          status: "unhealthy",
          server_name: serverConfig.name,
          version: serverConfig.version,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
          meta_api_connection: "failed",
        };

        return createToolResponse.error(JSON.stringify(errorData));
      }
    }
  );

  // Server capabilities tool
  toolFactory.registerTool(
    "get_capabilities",
    "Get comprehensive server capabilities, available tools, and API coverage information",
    z.object({}),
    async () => {
      const serverConfig = config.getServer();
      const metaConfig = config.getMeta();
      const rateLimits = config.getRateLimits();

      const capabilities = {
        server_info: {
          name: serverConfig.name,
          version: serverConfig.version,
          description: "MCP server providing access to Meta Marketing API for campaign management, analytics, and audience targeting",
        },
        api_coverage: {
          campaigns: {
            description: "Full campaign lifecycle management",
            operations: ["create", "read", "update", "delete", "pause", "resume"],
            supported_objectives: [
              "OUTCOME_APP_PROMOTION",
              "OUTCOME_AWARENESS", 
              "OUTCOME_ENGAGEMENT",
              "OUTCOME_LEADS",
              "OUTCOME_SALES",
              "OUTCOME_TRAFFIC",
            ],
          },
          ad_sets: {
            description: "Ad set management and targeting",
            operations: ["create", "read", "update", "list"],
            targeting_options: [
              "demographics",
              "interests", 
              "behaviors",
              "custom_audiences",
              "lookalike_audiences",
              "geographic",
            ],
          },
          ads: {
            description: "Individual ad management",
            operations: ["create", "read", "update", "list"],
            supported_formats: ["single_image", "carousel", "video", "collection"],
          },
          insights: {
            description: "Performance analytics and reporting",
            metrics: [
              "impressions",
              "clicks", 
              "spend",
              "reach",
              "frequency",
              "ctr",
              "cpc",
              "cpm",
              "conversions",
            ],
            breakdowns: ["age", "gender", "placement", "device", "country"],
            date_ranges: ["today", "yesterday", "last_7d", "last_30d", "last_90d", "custom"],
          },
          audiences: {
            description: "Custom and lookalike audience management",
            types: ["custom", "lookalike", "website", "app", "offline"],
            operations: ["create", "read", "update", "delete", "estimate_size"],
          },
          creatives: {
            description: "Ad creative management and testing",
            operations: ["create", "read", "preview", "ab_test_setup"],
            formats: ["image", "video", "carousel", "collection"],
          },
        },
        rate_limits: {
          development_tier: {
            max_score: rateLimits.development.maxScore,
            decay_time: `${rateLimits.development.decayTimeMs / 60000} minutes`,
            block_time: `${rateLimits.development.blockTimeMs / 60000} minutes`,
          },
          standard_tier: {
            max_score: rateLimits.standard.maxScore,
            decay_time: `${rateLimits.standard.decayTimeMs / 60000} minutes`, 
            block_time: `${rateLimits.standard.blockTimeMs / 60000} minutes`,
          },
          scoring: {
            read_calls: 1,
            write_calls: 3,
          },
        },
        authentication: {
          required: ["META_ACCESS_TOKEN"],
          optional: [
            "META_APP_ID",
            "META_APP_SECRET", 
            "META_BUSINESS_ID",
            "META_REDIRECT_URI",
            "META_REFRESH_TOKEN",
            "META_AUTO_REFRESH",
          ],
          token_validation: "automatic_on_startup",
          oauth_support: {
            authorization_flow: "supported",
            token_refresh: "automatic_with_configuration", 
            system_user_tokens: "supported",
            long_lived_tokens: "supported",
          },
        },
      };

      return createToolResponse.success(capabilities);
    }
  );

  // AI guidance tool (simplified from the massive inline version)
  toolFactory.registerTool(
    "get_ai_guidance",
    "Get workflow guidance and best practices for AI assistants using this Meta Marketing API server",
    z.object({}),
    async () => {
      const guidance = {
        server_purpose: {
          description: "This MCP server provides comprehensive access to Meta (Facebook/Instagram) advertising capabilities including campaign management, performance analytics, audience targeting, and creative optimization.",
          primary_use_cases: [
            "Campaign performance analysis and optimization",
            "Automated campaign creation and management", 
            "Audience research and targeting insights",
            "Creative performance testing and analysis",
            "Budget management and ROI optimization",
            "Multi-account advertising workflow automation",
          ],
        },
        common_workflows: {
          campaign_analysis: {
            description: "Analyze campaign performance and identify optimization opportunities",
            key_tools: ["get_ad_accounts", "list_campaigns", "get_insights", "compare_performance"],
          },
          new_campaign_setup: {
            description: "Create and launch a new advertising campaign",
            key_tools: ["create_campaign", "create_ad_set", "create_ad_creative", "create_ad"],
          },
          audience_research: {
            description: "Research and create targeted audiences for campaigns", 
            key_tools: ["list_audiences", "create_custom_audience", "create_lookalike_audience"],
          },
        },
        best_practices: {
          error_handling: [
            "Always check health_check before starting major operations",
            "Use get_ad_accounts to verify account access before campaign operations",
            "Handle rate limiting by spacing out API calls appropriately",
          ],
          performance_optimization: [
            "Use compare_performance to identify patterns across campaigns",
            "Export insights data for deeper analysis with export_insights",
            "Monitor budget utilization with regular get_insights calls",
          ],
        },
        next_steps_suggestions: [
          "Start with health_check to verify server connectivity",
          "Use get_ad_accounts to see available accounts", 
          "Explore existing campaigns with list_campaigns",
          "Check current performance with get_insights",
        ],
      };

      return createToolResponse.success(guidance);
    }
  );

  logger.info("System tools registered successfully");
}