/**
 * Refactored Campaign Tools - Using ToolFactory pattern to eliminate duplication
 * This demonstrates the new simplified pattern vs the old repetitive approach
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MetaApiClient } from "../meta-client.js";
import { ToolFactory, createToolResponse } from "../utils/tool-factory.js";
import { ResponseFormatter } from "../utils/response-formatter.js";
import {
  ListCampaignsSchema,
  CreateCampaignSchema,
  UpdateCampaignSchema,
  DeleteCampaignSchema,
  ListAdSetsSchema,
  CreateAdSetSchema,
} from "../types/mcp-tools.js";

export function registerCampaignToolsRefactored(
  server: McpServer,
  metaClient: MetaApiClient
) {
  const toolFactory = new ToolFactory(server);

  // List Campaigns Tool - Simplified with ToolFactory
  toolFactory.registerTool(
    "list_campaigns",
    "List and filter advertising campaigns for a Meta ad account. Use this to see all campaigns, check their status, budgets, and performance. Supports filtering by status (ACTIVE, PAUSED, etc.) and pagination.",
    ListCampaignsSchema,
    async ({ account_id, status, limit, after }) => {
      const result = await metaClient.getCampaigns(account_id, {
        status,
        limit,
        after,
      });

      const campaigns = result.data.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        effective_status: campaign.effective_status,
        created_time: campaign.created_time,
        updated_time: campaign.updated_time,
        start_time: campaign.start_time,
        stop_time: campaign.stop_time,
        daily_budget: campaign.daily_budget,
        lifetime_budget: campaign.lifetime_budget,
        budget_remaining: campaign.budget_remaining,
      }));

      return createToolResponse.success({
        campaigns,
        pagination: {
          has_next_page: result.hasNextPage,
          has_previous_page: result.hasPreviousPage,
          next_cursor: result.paging?.cursors?.after,
          previous_cursor: result.paging?.cursors?.before,
        },
        total_count: campaigns.length,
      });
    }
  );

  // Create Campaign Tool - Simplified
  toolFactory.registerTool(
    "create_campaign",
    "Create a new advertising campaign with specified objective, budget, and targeting options. Choose between daily or lifetime budget, set start/stop times, and configure optimization settings. Campaign starts in PAUSED status by default.",
    CreateCampaignSchema,
    async ({
      account_id,
      name,
      objective,
      status,
      daily_budget,
      lifetime_budget,
      start_time,
      stop_time,
      special_ad_categories,
      bid_strategy,
      bid_cap,
      budget_optimization,
    }) => {
      // Validation logic
      if (daily_budget && lifetime_budget) {
        return createToolResponse.error(
          "Cannot specify both daily_budget and lifetime_budget. Choose one budget type."
        );
      }

      if (!daily_budget && !lifetime_budget) {
        return createToolResponse.error(
          "Must specify either daily_budget or lifetime_budget."
        );
      }

      // Prepare campaign data
      const campaignData: any = {
        name,
        objective,
        status: status || "PAUSED",
      };

      if (daily_budget) campaignData.daily_budget = daily_budget;
      if (lifetime_budget) campaignData.lifetime_budget = lifetime_budget;
      if (start_time) campaignData.start_time = start_time;
      if (stop_time) campaignData.stop_time = stop_time;
      if (special_ad_categories) campaignData.special_ad_categories = special_ad_categories;
      if (bid_strategy) campaignData.bid_strategy = bid_strategy;
      if (bid_cap) campaignData.bid_cap = bid_cap;
      if (budget_optimization !== undefined) {
        campaignData.is_budget_optimization_enabled = budget_optimization;
      }

      const result = await metaClient.createCampaign(account_id, campaignData);

      return createToolResponse.success(
        {
          campaign_id: result.id,
          status: "created",
          details: campaignData,
        },
        `Campaign "${name}" created successfully`
      );
    }
  );

  // Update Campaign Tool - Simplified
  toolFactory.registerTool(
    "update_campaign",
    "Update an existing campaign's properties including name, status, budget, and schedule. Use this to modify campaign settings after creation.",
    UpdateCampaignSchema,
    async ({
      campaign_id,
      name,
      status,
      daily_budget,
      lifetime_budget,
      start_time,
      stop_time,
    }) => {
      if (daily_budget && lifetime_budget) {
        return createToolResponse.error(
          "Cannot specify both daily_budget and lifetime_budget. Choose one budget type."
        );
      }

      const updates: any = {};
      if (name) updates.name = name;
      if (status) updates.status = status;
      if (daily_budget) updates.daily_budget = daily_budget;
      if (lifetime_budget) updates.lifetime_budget = lifetime_budget;
      if (start_time) updates.start_time = start_time;
      if (stop_time) updates.stop_time = stop_time;

      await metaClient.updateCampaign(campaign_id, updates);

      return createToolResponse.success(
        {
          campaign_id,
          updated_fields: Object.keys(updates),
          updates,
        },
        "Campaign updated successfully"
      );
    }
  );

  // Delete Campaign Tool - Simplified
  toolFactory.registerTool(
    "delete_campaign",
    "Permanently delete an advertising campaign. This action cannot be undone. The campaign and all its ad sets and ads will be deleted.",
    DeleteCampaignSchema,
    async ({ campaign_id }) => {
      await metaClient.deleteCampaign(campaign_id);

      return createToolResponse.success(
        { campaign_id, status: "deleted" },
        "Campaign deleted successfully"
      );
    }
  );

  // Pause Campaign Tool - Simplified
  toolFactory.registerSimpleTool(
    "pause_campaign",
    "Pause an active campaign to temporarily stop ad delivery while preserving all settings and data.",
    UpdateCampaignSchema.pick({ campaign_id: true }),
    async ({ campaign_id }) => {
      await metaClient.updateCampaign(campaign_id, { status: "PAUSED" });
      return {
        campaign_id,
        status: "paused",
        message: "Campaign paused successfully"
      };
    }
  );

  // Resume Campaign Tool - Simplified
  toolFactory.registerSimpleTool(
    "resume_campaign", 
    "Resume a paused campaign to restart ad delivery with previous settings.",
    UpdateCampaignSchema.pick({ campaign_id: true }),
    async ({ campaign_id }) => {
      await metaClient.updateCampaign(campaign_id, { status: "ACTIVE" });
      return {
        campaign_id,
        status: "active",
        message: "Campaign resumed successfully"
      };
    }
  );

  // List Ad Sets Tool - Simplified
  toolFactory.registerTool(
    "list_ad_sets",
    "List ad sets for a specific campaign or account. View targeting settings, budgets, optimization goals, and performance status.",
    ListAdSetsSchema,
    async ({ campaign_id, account_id, status, limit, after }) => {
      const result = await metaClient.getAdSets({
        campaignId: campaign_id,
        accountId: account_id,
        status,
        limit,
        after,
      });

      return createToolResponse.success(
        ResponseFormatter.paginated(result.data, result.paging, result.data.length).data
      );
    }
  );

  // Create Ad Set Tool - Simplified (this was a complex one before)
  toolFactory.registerTool(
    "create_ad_set",
    "Create a new ad set within a campaign with targeting, budget, and optimization settings.",
    CreateAdSetSchema,
    async (params) => {
      return createToolResponse.fromApiCall(
        () => metaClient.createAdSet(params.campaign_id, {
          name: params.name,
          daily_budget: params.daily_budget,
          lifetime_budget: params.lifetime_budget,
          optimization_goal: params.optimization_goal,
          billing_event: params.billing_event,
          bid_amount: params.bid_amount,
          start_time: params.start_time,
          end_time: params.end_time,
          targeting: params.targeting,
          status: params.status,
          promoted_object: params.promoted_object,
          attribution_spec: params.attribution_spec,
          destination_type: params.destination_type,
        }),
        "Ad set creation"
      );
    }
  );
}