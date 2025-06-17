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
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const CreateCampaignSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  name: z.string().min(1).describe("Campaign name"),
  objective: z
    .string()
    .describe(
      "Campaign objective (e.g., OUTCOME_TRAFFIC, OUTCOME_CONVERSIONS)"
    ),
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
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
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
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const DeleteCampaignSchema = z.object({
  campaign_id: z.string().describe("Campaign ID to delete"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

// Ad Set Management Schemas
export const ListAdSetsSchema = z.object({
  campaign_id: z.string().optional().describe("Filter by campaign ID"),
  account_id: z.string().optional().describe("Filter by account ID"),
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
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const CreateAdSetSchema = z.object({
  campaign_id: z.string().describe("Campaign ID for the ad set"),
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
    .string()
    .describe("Optimization goal (e.g., LINK_CLICKS, CONVERSIONS)"),
  billing_event: z
    .string()
    .describe("Billing event (e.g., LINK_CLICKS, IMPRESSIONS)"),
  bid_amount: z
    .number()
    .positive()
    .optional()
    .describe("Bid amount in account currency cents"),
  start_time: z
    .string()
    .optional()
    .describe("Ad set start time (ISO 8601 format)"),
  end_time: z.string().optional().describe("Ad set end time (ISO 8601 format)"),
  targeting: z
    .object({
      age_min: z
        .number()
        .min(13)
        .max(65)
        .optional()
        .describe("Minimum age for targeting"),
      age_max: z
        .number()
        .min(13)
        .max(65)
        .optional()
        .describe("Maximum age for targeting"),
      genders: z
        .array(z.number().min(1).max(2))
        .optional()
        .describe("Gender targeting (1=male, 2=female)"),
      geo_locations: z
        .object({
          countries: z
            .array(z.string())
            .optional()
            .describe("Country codes for targeting"),
          regions: z
            .array(z.object({ key: z.string() }))
            .optional()
            .describe("Region targeting"),
          cities: z
            .array(
              z.object({
                key: z.string(),
                radius: z.number().optional(),
                distance_unit: z.enum(["mile", "kilometer"]).optional(),
              })
            )
            .optional()
            .describe("City targeting with optional radius"),
        })
        .optional()
        .describe("Geographic targeting"),
      interests: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
          })
        )
        .optional()
        .describe("Interest targeting"),
      behaviors: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
          })
        )
        .optional()
        .describe("Behavior targeting"),
      custom_audiences: z
        .array(z.string())
        .optional()
        .describe("Custom audience IDs"),
      lookalike_audiences: z
        .array(z.string())
        .optional()
        .describe("Lookalike audience IDs"),
      device_platforms: z
        .array(z.enum(["mobile", "desktop"]))
        .optional()
        .describe("Device platform targeting"),
      publisher_platforms: z
        .array(z.enum(["facebook", "instagram", "messenger", "whatsapp"]))
        .optional()
        .describe("Publisher platform targeting"),
    })
    .optional()
    .describe("Targeting parameters"),
  status: z
    .enum(["ACTIVE", "PAUSED"])
    .default("PAUSED")
    .describe("Initial ad set status"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

// Analytics Schemas
export const GetInsightsSchema = z.object({
  object_id: z
    .string()
    .describe("ID of campaign, ad set, or ad to get insights for"),
  level: z
    .enum(["account", "campaign", "adset", "ad"])
    .describe("Level of insights to retrieve"),
  date_preset: z
    .enum([
      "today",
      "yesterday",
      "this_week",
      "last_week",
      "this_month",
      "last_month",
      "this_quarter",
      "last_quarter",
      "this_year",
      "last_year",
      "lifetime",
    ])
    .optional()
    .describe("Date preset for insights"),
  time_range: z
    .object({
      since: z.string().describe("Start date (YYYY-MM-DD)"),
      until: z.string().describe("End date (YYYY-MM-DD)"),
    })
    .optional()
    .describe("Custom date range for insights"),
  fields: z
    .array(z.string())
    .optional()
    .describe("Specific fields to retrieve (e.g., impressions, clicks, spend)"),
  breakdowns: z
    .array(z.string())
    .optional()
    .describe("Breakdown dimensions (e.g., age, gender, placement)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .describe("Number of insights to return"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const ComparePerformanceSchema = z.object({
  object_ids: z
    .array(z.string())
    .min(2)
    .max(10)
    .describe("IDs of campaigns/ad sets/ads to compare"),
  level: z
    .enum(["campaign", "adset", "ad"])
    .describe("Level of objects being compared"),
  date_preset: z
    .enum([
      "today",
      "yesterday",
      "this_week",
      "last_week",
      "this_month",
      "last_month",
      "this_quarter",
      "last_quarter",
      "this_year",
      "last_year",
      "lifetime",
    ])
    .optional()
    .describe("Date preset for comparison"),
  time_range: z
    .object({
      since: z.string().describe("Start date (YYYY-MM-DD)"),
      until: z.string().describe("End date (YYYY-MM-DD)"),
    })
    .optional()
    .describe("Custom date range for comparison"),
  metrics: z
    .array(z.string())
    .default(["impressions", "clicks", "spend", "ctr", "cpc"])
    .describe("Metrics to compare"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const ExportInsightsSchema = z.object({
  object_id: z
    .string()
    .describe("ID of campaign, ad set, or ad to export insights for"),
  level: z
    .enum(["account", "campaign", "adset", "ad"])
    .describe("Level of insights to export"),
  format: z.enum(["csv", "json"]).default("csv").describe("Export format"),
  date_preset: z
    .enum([
      "today",
      "yesterday",
      "this_week",
      "last_week",
      "this_month",
      "last_month",
      "this_quarter",
      "last_quarter",
      "this_year",
      "last_year",
      "lifetime",
    ])
    .optional()
    .describe("Date preset for export"),
  time_range: z
    .object({
      since: z.string().describe("Start date (YYYY-MM-DD)"),
      until: z.string().describe("End date (YYYY-MM-DD)"),
    })
    .optional()
    .describe("Custom date range for export"),
  fields: z.array(z.string()).optional().describe("Specific fields to export"),
  breakdowns: z
    .array(z.string())
    .optional()
    .describe("Breakdown dimensions to include"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

// Audience Management Schemas
export const ListAudiencesSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  type: z
    .enum(["custom", "lookalike", "saved"])
    .optional()
    .describe("Filter by audience type"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .describe("Number of audiences to return"),
  after: z.string().optional().describe("Pagination cursor for next page"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const CreateCustomAudienceSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  name: z.string().min(1).describe("Custom audience name"),
  description: z.string().optional().describe("Custom audience description"),
  subtype: z
    .enum([
      "CUSTOM",
      "WEBSITE",
      "APP",
      "OFFLINE_CONVERSION",
      "CLAIM",
      "PARTNER",
      "VIDEO",
      "BAG_OF_ACCOUNTS",
      "STUDY_RULE_AUDIENCE",
      "FOX",
    ])
    .describe("Custom audience subtype"),
  customer_file_source: z
    .enum([
      "USER_PROVIDED_ONLY",
      "PARTNER_PROVIDED_ONLY",
      "BOTH_USER_AND_PARTNER_PROVIDED",
    ])
    .optional()
    .describe("Customer file source"),
  retention_days: z
    .number()
    .min(1)
    .max(180)
    .optional()
    .describe("Retention days for the audience"),
  rule: z
    .any()
    .optional()
    .describe("Rule definition for the audience (depends on subtype)"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const CreateLookalikeAudienceSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  name: z.string().min(1).describe("Lookalike audience name"),
  origin_audience_id: z.string().describe("ID of the source custom audience"),
  country: z.string().describe("Country code for the lookalike audience"),
  ratio: z
    .number()
    .min(0.01)
    .max(0.2)
    .describe("Ratio of the population to target (0.01 = 1%, 0.2 = 20%)"),
  description: z.string().optional().describe("Lookalike audience description"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const EstimateAudienceSizeSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  targeting: z
    .object({
      age_min: z
        .number()
        .min(13)
        .max(65)
        .optional()
        .describe("Minimum age for targeting"),
      age_max: z
        .number()
        .min(13)
        .max(65)
        .optional()
        .describe("Maximum age for targeting"),
      genders: z
        .array(z.number().min(1).max(2))
        .optional()
        .describe("Gender targeting (1=male, 2=female)"),
      geo_locations: z
        .object({
          countries: z
            .array(z.string())
            .optional()
            .describe("Country codes for targeting"),
          regions: z
            .array(z.object({ key: z.string() }))
            .optional()
            .describe("Region targeting"),
          cities: z
            .array(
              z.object({
                key: z.string(),
                radius: z.number().optional(),
                distance_unit: z.enum(["mile", "kilometer"]).optional(),
              })
            )
            .optional()
            .describe("City targeting with optional radius"),
        })
        .optional()
        .describe("Geographic targeting"),
      interests: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
          })
        )
        .optional()
        .describe("Interest targeting"),
      behaviors: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
          })
        )
        .optional()
        .describe("Behavior targeting"),
      custom_audiences: z
        .array(z.string())
        .optional()
        .describe("Custom audience IDs"),
      lookalike_audiences: z
        .array(z.string())
        .optional()
        .describe("Lookalike audience IDs"),
    })
    .describe("Targeting parameters for size estimation"),
  optimization_goal: z.string().describe("Optimization goal for the estimate"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

// Creative Management Schemas
export const ListCreativesSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .describe("Number of creatives to return"),
  after: z.string().optional().describe("Pagination cursor for next page"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const CreateAdCreativeSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  name: z.string().min(1).describe("Creative name"),
  title: z.string().optional().describe("Ad title"),
  body: z.string().optional().describe("Ad body text"),
  image_url: z.string().url().optional().describe("Image URL for the creative"),
  video_id: z.string().optional().describe("Video ID for video creatives"),
  call_to_action: z
    .object({
      type: z
        .string()
        .describe("Call to action type (e.g., LEARN_MORE, SHOP_NOW)"),
      value: z
        .any()
        .optional()
        .describe("Call to action value (e.g., link URL)"),
    })
    .optional()
    .describe("Call to action configuration"),
  link_url: z.string().url().optional().describe("Destination URL for the ad"),
  display_link: z.string().optional().describe("Display link text"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

export const PreviewAdSchema = z.object({
  creative_id: z.string().describe("Creative ID to preview"),
  ad_format: z
    .enum([
      "DESKTOP_FEED_STANDARD",
      "MOBILE_FEED_STANDARD",
      "MOBILE_FEED_BASIC",
      "MOBILE_BANNER",
      "MOBILE_MEDIUM_RECTANGLE",
      "MOBILE_FULLWIDTH",
      "MOBILE_INTERSTITIAL",
      "INSTAGRAM_STANDARD",
      "INSTAGRAM_STORY",
    ])
    .describe("Ad format for preview"),
  product_item_ids: z
    .array(z.string())
    .optional()
    .describe("Product item IDs for dynamic ads"),
  access_token: z.string().optional().describe("Meta Marketing API access token (if not provided via environment)"),
});

// Type exports for runtime use
export type ListCampaignsParams = z.infer<typeof ListCampaignsSchema>;
export type CreateCampaignParams = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignParams = z.infer<typeof UpdateCampaignSchema>;
export type DeleteCampaignParams = z.infer<typeof DeleteCampaignSchema>;
export type ListAdSetsParams = z.infer<typeof ListAdSetsSchema>;
export type CreateAdSetParams = z.infer<typeof CreateAdSetSchema>;
export type GetInsightsParams = z.infer<typeof GetInsightsSchema>;
export type ComparePerformanceParams = z.infer<typeof ComparePerformanceSchema>;
export type ExportInsightsParams = z.infer<typeof ExportInsightsSchema>;
export type ListAudiencesParams = z.infer<typeof ListAudiencesSchema>;
export type CreateCustomAudienceParams = z.infer<
  typeof CreateCustomAudienceSchema
>;
export type CreateLookalikeAudienceParams = z.infer<
  typeof CreateLookalikeAudienceSchema
>;
export type EstimateAudienceSizeParams = z.infer<
  typeof EstimateAudienceSizeSchema
>;
export type ListCreativesParams = z.infer<typeof ListCreativesSchema>;
export type CreateAdCreativeParams = z.infer<typeof CreateAdCreativeSchema>;
export type PreviewAdParams = z.infer<typeof PreviewAdSchema>;
