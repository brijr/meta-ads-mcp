/**
 * Audience related Zod schemas
 * Extracted from the massive mcp-tools.ts file for better organization
 */

import { z } from "zod";

// Audience Management Schemas
export const ListAudiencesSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .describe("Number of audiences to return"),
  after: z.string().optional().describe("Pagination cursor for next page"),
  fields: z
    .array(z.string())
    .optional()
    .describe("Specific fields to retrieve for each audience"),
});

export const CreateCustomAudienceSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  name: z.string().min(1).describe("Audience name"),
  description: z.string().optional().describe("Audience description"),
  subtype: z
    .enum([
      "CUSTOM",
      "WEBSITE", 
      "APP",
      "OFFLINE_CONVERSION",
      "CLAIM",
      "PARTNER",
      "MANAGED",
      "VIDEO",
      "LOOKALIKE",
      "ENGAGEMENT",
      "DATA_SET",
      "BAG_OF_ACCOUNTS",
      "STUDY_RULE_AUDIENCE",
      "FOX"
    ])
    .describe("Type of custom audience"),
  customer_file_source: z
    .enum(["USER_PROVIDED_ONLY", "PARTNER_PROVIDED_ONLY", "BOTH_USER_AND_PARTNER_PROVIDED"])
    .optional()
    .describe("Source of customer data"),
  retention_days: z
    .number()
    .min(1)
    .max(180)
    .default(30)
    .describe("Number of days to retain audience data"),
  rule: z
    .object({
      url: z.object({
        url_contains: z.string().optional(),
        url_equals: z.string().optional(),
        url_not_contains: z.string().optional(),
      }).optional(),
      event: z.object({
        event_name: z.string(),
        event_params: z.record(z.string()).optional(),
      }).optional(),
      custom_data: z.object({
        emails: z.array(z.string()).optional(),
        phone_numbers: z.array(z.string()).optional(),
        first_names: z.array(z.string()).optional(),
        last_names: z.array(z.string()).optional(),
        birth_dates: z.array(z.string()).optional(),
        cities: z.array(z.string()).optional(),
        states: z.array(z.string()).optional(),
        countries: z.array(z.string()).optional(),
        zip_codes: z.array(z.string()).optional(),
      }).optional(),
    })
    .optional()
    .describe("Audience creation rule"),
});

export const CreateLookalikeAudienceSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  name: z.string().min(1).describe("Lookalike audience name"),
  origin_audience_id: z.string().describe("Source audience ID for lookalike creation"),
  country: z.string().describe("Target country for lookalike audience (ISO country code)"),
  ratio: z
    .number()
    .min(0.01)
    .max(0.20)
    .describe("Lookalike ratio (1% = 0.01, 10% = 0.10, etc.)"),
  description: z.string().optional().describe("Lookalike audience description"),
});

export const GetAudienceInfoSchema = z.object({
  audience_id: z.string().describe("Custom audience ID"),
  fields: z
    .array(z.enum([
      "id",
      "name",
      "description",
      "subtype",
      "approximate_count",
      "data_source",
      "retention_days",
      "creation_time",
      "operation_status",
      "delivery_status",
      "permission_for_actions",
      "pixel_id",
      "lookalike_audience_ids",
      "lookalike_spec",
      "rule",
      "rule_aggregation"
    ]))
    .optional()
    .describe("Specific fields to retrieve"),
});

export const EstimateAudienceSizeSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
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
      life_events: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
      family_statuses: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
      work_employers: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
      work_positions: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
      education_schools: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
      education_majors: z.array(z.object({
        id: z.string(),
        name: z.string().optional()
      })).optional(),
    })
    .describe("Targeting specification to estimate"),
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
      "EVENT_RESPONSES"
    ])
    .describe("Optimization goal for audience size estimation"),
});

export const UpdateAudienceSchema = z.object({
  audience_id: z.string().describe("Audience ID to update"),
  name: z.string().optional().describe("New audience name"),
  description: z.string().optional().describe("New audience description"),
  retention_days: z
    .number()
    .min(1)
    .max(180)
    .optional()
    .describe("New retention period in days"),
});

export const DeleteAudienceSchema = z.object({
  audience_id: z.string().describe("Audience ID to delete"),
});

export type ListAudiencesInput = z.infer<typeof ListAudiencesSchema>;
export type CreateCustomAudienceInput = z.infer<typeof CreateCustomAudienceSchema>;
export type CreateLookalikeAudienceInput = z.infer<typeof CreateLookalikeAudienceSchema>;
export type GetAudienceInfoInput = z.infer<typeof GetAudienceInfoSchema>;
export type EstimateAudienceSizeInput = z.infer<typeof EstimateAudienceSizeSchema>;
export type UpdateAudienceInput = z.infer<typeof UpdateAudienceSchema>;
export type DeleteAudienceInput = z.infer<typeof DeleteAudienceSchema>;