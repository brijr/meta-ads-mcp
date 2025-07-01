/**
 * Analytics and Insights related Zod schemas
 * Extracted from the massive mcp-tools.ts file for better organization
 */

import { z } from "zod";

// Common date and time schemas
const DatePresetSchema = z.enum([
  "today",
  "yesterday", 
  "this_month",
  "last_month",
  "this_quarter",
  "maximum",
  "data_maximum",
  "last_3d",
  "last_7d",
  "last_14d",
  "last_28d",
  "last_30d",
  "last_90d",
  "last_week_mon_sun",
  "last_week_sun_sat",
  "last_quarter",
  "last_year",
  "this_week_mon_today",
  "this_week_sun_today",
  "this_year"
]);

const TimeRangeSchema = z.object({
  since: z.string().describe("Start date in YYYY-MM-DD format"),
  until: z.string().describe("End date in YYYY-MM-DD format"),
});

const InsightsFieldsSchema = z.array(z.enum([
  "impressions",
  "clicks",
  "spend",
  "reach",
  "frequency",
  "ctr",
  "cpc", 
  "cpm",
  "cpp",
  "actions",
  "conversions",
  "conversion_values",
  "cost_per_action_type",
  "cost_per_conversion",
  "video_play_actions",
  "video_p25_watched_actions",
  "video_p50_watched_actions", 
  "video_p75_watched_actions",
  "video_p100_watched_actions",
  "unique_clicks",
  "unique_ctr",
  "unique_link_clicks_ctr",
  "cost_per_unique_click",
  "social_spend",
  "inline_link_clicks",
  "inline_link_click_ctr",
  "cost_per_inline_link_click",
  "inline_post_engagement",
  "cost_per_inline_post_engagement"
]));

const BreakdownsSchema = z.array(z.enum([
  "age",
  "gender",
  "country",
  "region",
  "impression_device",
  "placement",
  "platform_position",
  "publisher_platform",
  "device_platform",
  "product_id",
  "hourly_stats_aggregated_by_advertiser_time_zone",
  "hourly_stats_aggregated_by_audience_time_zone"
]));

// Analytics Schemas
export const GetInsightsSchema = z.object({
  object_id: z.string().describe("Object ID (account, campaign, ad set, or ad)"),
  level: z
    .enum(["account", "campaign", "adset", "ad"])
    .optional()
    .describe("Level of insights to retrieve"),
  date_preset: DatePresetSchema
    .optional()
    .describe("Preset date range for insights"),
  time_range: TimeRangeSchema
    .optional()
    .describe("Custom date range (cannot be used with date_preset)"),
  fields: InsightsFieldsSchema
    .optional()
    .describe("Specific metrics to retrieve"),
  breakdowns: BreakdownsSchema
    .optional()
    .describe("Breakdowns to apply to the data"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .describe("Number of results to return"),
  after: z.string().optional().describe("Pagination cursor for next page"),
});

export const ComparePerformanceSchema = z.object({
  object_ids: z
    .array(z.string())
    .min(2)
    .max(10)
    .describe("Array of object IDs to compare (campaigns, ad sets, or ads)"),
  level: z
    .enum(["account", "campaign", "adset", "ad"])
    .optional()
    .describe("Level of insights to retrieve"),
  date_preset: DatePresetSchema
    .optional()
    .describe("Preset date range for comparison"),
  time_range: TimeRangeSchema
    .optional()
    .describe("Custom date range for comparison"),
  fields: InsightsFieldsSchema
    .optional()
    .describe("Specific metrics to compare"),
  breakdowns: BreakdownsSchema
    .optional()
    .describe("Breakdowns to apply to the comparison"),
});

export const ExportInsightsSchema = z.object({
  object_id: z.string().describe("Object ID to export insights for"),
  format: z
    .enum(["json", "csv"])
    .default("json")
    .describe("Export format"),
  level: z
    .enum(["account", "campaign", "adset", "ad"])
    .optional()
    .describe("Level of insights to export"),
  date_preset: DatePresetSchema
    .optional()
    .describe("Preset date range for export"),
  time_range: TimeRangeSchema
    .optional()
    .describe("Custom date range for export"),
  fields: InsightsFieldsSchema
    .optional()
    .describe("Specific metrics to export"),
  breakdowns: BreakdownsSchema
    .optional()
    .describe("Breakdowns to apply to the export"),
});

export const GetCampaignPerformanceSchema = z.object({
  campaign_id: z.string().describe("Campaign ID to analyze"),
  date_preset: DatePresetSchema
    .optional()
    .describe("Preset date range for analysis"),
  time_range: TimeRangeSchema
    .optional()
    .describe("Custom date range for analysis"),
  include_breakdowns: z
    .boolean()
    .default(false)
    .describe("Include demographic and placement breakdowns"),
  fields: InsightsFieldsSchema
    .optional()
    .describe("Specific metrics to analyze"),
});

export const GetAttributionDataSchema = z.object({
  object_id: z.string().describe("Object ID for attribution analysis"),
  attribution_windows: z
    .array(z.enum(["1d_click", "7d_click", "28d_click", "1d_view", "7d_view", "28d_view"]))
    .optional()
    .describe("Attribution windows to analyze"),
  date_preset: DatePresetSchema
    .optional()
    .describe("Preset date range for attribution"),
  time_range: TimeRangeSchema
    .optional()
    .describe("Custom date range for attribution"),
  fields: z
    .array(z.enum([
      "actions",
      "cost_per_action_type", 
      "conversions",
      "conversion_values",
      "cost_per_conversion"
    ]))
    .optional()
    .describe("Attribution-specific metrics to retrieve"),
});

export type GetInsightsInput = z.infer<typeof GetInsightsSchema>;
export type ComparePerformanceInput = z.infer<typeof ComparePerformanceSchema>;
export type ExportInsightsInput = z.infer<typeof ExportInsightsSchema>;
export type GetCampaignPerformanceInput = z.infer<typeof GetCampaignPerformanceSchema>;
export type GetAttributionDataInput = z.infer<typeof GetAttributionDataSchema>;