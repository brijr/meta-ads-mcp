/**
 * Campaign-related Zod schemas
 * Extracted from the massive mcp-tools.ts file for better organization
 */

import { z } from "zod";

// Campaign Management Schemas
export const ListCampaignsSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  status: z
    .enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"])
    .optional()
    .describe("Filter by campaign status"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .describe("Number of campaigns to return"),
  after: z.string().optional().describe("Pagination cursor for next page"),
});

export const CreateCampaignSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  name: z.string().min(1).describe("Campaign name"),
  objective: z
    .enum([
      "OUTCOME_APP_PROMOTION",
      "OUTCOME_AWARENESS",
      "OUTCOME_ENGAGEMENT",
      "OUTCOME_LEADS",
      "OUTCOME_SALES",
      "OUTCOME_TRAFFIC",
    ])
    .describe("Campaign objective using Outcome-Driven Ad Experience (ODAE) format"),
  status: z
    .enum(["ACTIVE", "PAUSED"])
    .default("PAUSED")
    .describe("Initial campaign status"),
  daily_budget: z
    .number()
    .positive()
    .optional()
    .describe("Daily budget in account currency cents"),
  lifetime_budget: z
    .number()
    .positive()
    .optional()
    .describe("Lifetime budget in account currency cents"),
  start_time: z
    .string()
    .optional()
    .describe("Campaign start time (ISO 8601 format)"),
  stop_time: z
    .string()
    .optional()
    .describe("Campaign stop time (ISO 8601 format)"),
  special_ad_categories: z
    .array(
      z.enum([
        "NONE",
        "EMPLOYMENT",
        "HOUSING",
        "CREDIT",
        "SOCIAL_ISSUES_ELECTIONS_POLITICS",
      ])
    )
    .optional()
    .describe("Special ad categories for regulated industries"),
  bid_strategy: z
    .enum(["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP", "COST_CAP"])
    .optional()
    .describe("Bid strategy for the campaign"),
  bid_cap: z
    .number()
    .positive()
    .optional()
    .describe("Bid cap amount in account currency cents"),
  budget_optimization: z
    .boolean()
    .optional()
    .describe("Enable campaign budget optimization across ad sets"),
});

export const UpdateCampaignSchema = z.object({
  campaign_id: z.string().describe("Campaign ID to update"),
  name: z.string().optional().describe("New campaign name"),
  status: z
    .enum(["ACTIVE", "PAUSED", "ARCHIVED"])
    .optional()
    .describe("New campaign status"),
  daily_budget: z
    .number()
    .positive()
    .optional()
    .describe("New daily budget in account currency cents"),
  lifetime_budget: z
    .number()
    .positive()
    .optional()
    .describe("New lifetime budget in account currency cents"),
  start_time: z
    .string()
    .optional()
    .describe("New campaign start time (ISO 8601 format)"),
  stop_time: z
    .string()
    .optional()
    .describe("New campaign stop time (ISO 8601 format)"),
});

export const DeleteCampaignSchema = z.object({
  campaign_id: z.string().describe("Campaign ID to delete"),
});

// Ad Set Schemas
export const ListAdSetsSchema = z.object({
  campaign_id: z.string().optional().describe("Campaign ID to list ad sets for"),
  account_id: z.string().optional().describe("Account ID to list ad sets for"),
  status: z
    .enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"])
    .optional()
    .describe("Filter by ad set status"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .describe("Number of ad sets to return"),
  after: z.string().optional().describe("Pagination cursor for next page"),
});

export const CreateAdSetSchema = z.object({
  campaign_id: z.string().describe("Campaign ID to create ad set in"),
  name: z.string().min(1).describe("Ad set name"),
  daily_budget: z
    .number()
    .positive()
    .optional()
    .describe("Daily budget in account currency cents"),
  lifetime_budget: z
    .number()
    .positive()
    .optional()
    .describe("Lifetime budget in account currency cents"),
  optimization_goal: z
    .enum([
      "REACH",
      "LINK_CLICKS", 
      "IMPRESSIONS",
      "APP_INSTALLS",
      "OFFSITE_CONVERSIONS",
      "CONVERSATIONS",
      "LEAD_GENERATION",
      "QUALITY_LEAD",
      "LANDING_PAGE_VIEWS",
      "POST_ENGAGEMENT",
      "PAGE_LIKES",
      "EVENT_RESPONSES",
      "MESSAGES",
      "THRUPLAY",
      "REPLIES",
      "DERIVED_EVENTS",
      "AD_RECALL_LIFT",
      "ENGAGED_USERS",
      "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS",
      "APP_DOWNLOADS",
      "APP_ENGAGEMENT"
    ])
    .describe("Optimization goal for the ad set"),
  billing_event: z
    .enum([
      "APP_INSTALLS",
      "CLICKS",
      "IMPRESSIONS", 
      "LINK_CLICKS",
      "NONE",
      "OFFER_CLAIMS",
      "PAGE_LIKES",
      "POST_ENGAGEMENT",
      "VIDEO_VIEWS",
      "THRUPLAY",
      "LISTING_INTERACTION",
      "QUALITY_LEAD"
    ])
    .describe("Billing event for the ad set"),
  bid_amount: z
    .number()
    .positive()
    .optional()
    .describe("Bid amount in account currency cents"),
  start_time: z
    .string()
    .optional()
    .describe("Ad set start time (ISO 8601 format)"),
  end_time: z
    .string()
    .optional()
    .describe("Ad set end time (ISO 8601 format)"),
  targeting: z
    .object({
      geo_locations: z.object({
        countries: z.array(z.string()).optional(),
        regions: z.array(z.object({
          key: z.string(),
          name: z.string().optional()
        })).optional(),
        cities: z.array(z.object({
          key: z.string(),
          name: z.string().optional(),
          radius: z.number().optional(),
          distance_unit: z.enum(["mile", "kilometer"]).optional()
        })).optional(),
      }).optional(),
      age_min: z.number().min(13).max(65).optional(),
      age_max: z.number().min(13).max(65).optional(), 
      genders: z.array(z.enum(["1", "2"])).optional(),
      interests: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
      behaviors: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
      custom_audiences: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
      excluded_custom_audiences: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
    })
    .optional()
    .describe("Targeting specification for the ad set"),
  status: z
    .enum(["ACTIVE", "PAUSED"])
    .default("PAUSED")
    .describe("Initial ad set status"),
  promoted_object: z
    .object({
      page_id: z.string().optional(),
      pixel_id: z.string().optional(),
      application_id: z.string().optional(),
      object_store_url: z.string().optional(),
      custom_event_type: z.string().optional(),
    })
    .optional()
    .describe("Promoted object configuration"),
  attribution_spec: z
    .array(
      z.object({
        event_type: z.string(),
        window_days: z.number(),
      })
    )
    .optional()
    .describe("Attribution specification"),
  destination_type: z
    .enum(["WEBSITE", "APP", "MESSENGER", "APPLINKS_AUTOMATIC"])
    .optional()
    .describe("Destination type for the ad set"),
});

export type ListCampaignsInput = z.infer<typeof ListCampaignsSchema>;
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;
export type DeleteCampaignInput = z.infer<typeof DeleteCampaignSchema>;
export type ListAdSetsInput = z.infer<typeof ListAdSetsSchema>;
export type CreateAdSetInput = z.infer<typeof CreateAdSetSchema>;