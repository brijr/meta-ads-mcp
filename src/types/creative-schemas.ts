/**
 * Creative and Ad related Zod schemas
 * Extracted from the massive mcp-tools.ts file for better organization
 */

import { z } from "zod";

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
  fields: z
    .array(z.string())
    .optional()
    .describe("Specific fields to retrieve for each creative"),
});

export const CreateAdCreativeSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  name: z.string().min(1).describe("Creative name"),
  object_story_spec: z
    .object({
      page_id: z.string().describe("Facebook Page ID for the creative"),
      link_data: z
        .object({
          call_to_action: z
            .object({
              type: z.enum([
                "OPEN_LINK",
                "LIKE_PAGE", 
                "SHOP_NOW",
                "PLAY_GAME",
                "INSTALL_APP",
                "USE_APP",
                "INSTALL_MOBILE_APP",
                "USE_MOBILE_APP",
                "BOOK_TRAVEL",
                "LISTEN_MUSIC",
                "WATCH_VIDEO",
                "LEARN_MORE",
                "SIGN_UP",
                "DOWNLOAD",
                "WATCH_MORE",
                "NO_BUTTON",
                "VISIT_PAGES_FEED",
                "APPLY_NOW",
                "BUY_NOW",
                "GET_OFFER",
                "GET_OFFER_VIEW",
                "BUY_TICKETS",
                "UPDATE_APP",
                "GET_DIRECTIONS",
                "BUY",
                "MESSAGE_PAGE",
                "SUBSCRIBE",
                "SELL_NOW",
                "DONATE_NOW",
                "GET_QUOTE",
                "CONTACT_US",
                "START_ORDER",
                "CONTINUE_SHOPPING",
                "ORDER_NOW"
              ]).describe("Call to action button type"),
              value: z
                .object({
                  link: z.string().url().optional().describe("Destination URL"),
                  application_id: z.string().optional().describe("App ID for app install campaigns"),
                  lead_gen_form_id: z.string().optional().describe("Lead form ID for lead generation"),
                })
                .optional()
                .describe("Call to action value configuration"),
            })
            .optional()
            .describe("Call to action button configuration"),
          description: z.string().optional().describe("Ad description text"),
          link: z.string().url().describe("Primary destination URL"),
          message: z.string().optional().describe("Primary text/message for the ad"),
          name: z.string().describe("Headline text"),
          picture: z.string().url().optional().describe("Image URL for the creative"),
          caption: z.string().optional().describe("Link caption text"),
        })
        .optional()
        .describe("Link data for link-type ads"),
      photo_data: z
        .object({
          image_hash: z.string().optional().describe("Uploaded image hash"),
          url: z.string().url().optional().describe("Image URL"),
          caption: z.string().optional().describe("Photo caption"),
        })
        .optional()
        .describe("Photo data for image-type ads"),
      video_data: z
        .object({
          video_id: z.string().optional().describe("Uploaded video ID"),
          image_url: z.string().url().optional().describe("Video thumbnail URL"),
          title: z.string().optional().describe("Video title"),
          message: z.string().optional().describe("Video description"),
          call_to_action: z
            .object({
              type: z.string(),
              value: z.object({
                link: z.string().url().optional(),
              }).optional(),
            })
            .optional(),
        })
        .optional()
        .describe("Video data for video-type ads"),
      template_data: z
        .object({
          message: z.string().describe("Primary text"),
          name: z.string().describe("Headline"),
          description: z.string().optional().describe("Description text"),
          link: z.string().url().describe("Destination URL"),
          call_to_action: z
            .object({
              type: z.string(),
              value: z.object({
                link: z.string().url().optional(),
              }).optional(),
            })
            .optional(),
        })
        .optional()
        .describe("Template data for standardized ads"),
    })
    .describe("Object story specification defining the creative content"),
  degrees_of_freedom_spec: z
    .object({
      creative_features_spec: z
        .object({
          standard_enhancements: z
            .object({
              enroll_status: z.enum(["OPT_IN", "OPT_OUT"]).optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional()
    .describe("Degrees of freedom for creative optimization"),
});

export const UpdateCreativeSchema = z.object({
  creative_id: z.string().describe("Creative ID to update"),
  name: z.string().optional().describe("New creative name"),
  object_story_spec: z
    .object({
      page_id: z.string().optional(),
      link_data: z
        .object({
          message: z.string().optional(),
          name: z.string().optional(),
          description: z.string().optional(),
          link: z.string().url().optional(),
          picture: z.string().url().optional(),
        })
        .optional(),
    })
    .optional()
    .describe("Updated object story specification"),
});

export const DeleteCreativeSchema = z.object({
  creative_id: z.string().describe("Creative ID to delete"),
});

export const PreviewAdSchema = z.object({
  creative_id: z.string().describe("Creative ID to preview"),
  ad_format: z
    .enum([
      "DESKTOP_FEED_STANDARD",
      "MOBILE_FEED_STANDARD",
      "MOBILE_FEED_BASIC",
      "MOBILE_FULLWIDTH",
      "MOBILE_INTERSTITIAL",
      "MOBILE_MEDIUM_RECTANGLE",
      "MOBILE_BANNER",
      "DESKTOP_RIGHT_COLUMN_STANDARD",
      "DESKTOP_FEED_STANDARD",
      "INSTAGRAM_STANDARD",
      "INSTAGRAM_STORY",
      "AUDIENCE_NETWORK_OUTSTREAM_VIDEO",
      "AUDIENCE_NETWORK_INSTREAM_VIDEO",
      "AUDIENCE_NETWORK_BANNER",
      "AUDIENCE_NETWORK_INTERSTITIAL",
      "AUDIENCE_NETWORK_NATIVE",
      "AUDIENCE_NETWORK_REWARDED_VIDEO",
      "MESSENGER_MOBILE_INBOX_MEDIA",
      "MESSENGER_MOBILE_STORY_MEDIA",
      "MESSENGER_DESKTOP_INBOX_MEDIA"
    ])
    .describe("Ad format for preview generation"),
  product_item_ids: z
    .array(z.string())
    .optional()
    .describe("Product item IDs for dynamic product ads"),
});

export const ValidateCreativeSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  creative_spec: z
    .object({
      page_id: z.string(),
      link_data: z.object({
        link: z.string().url(),
        message: z.string().optional(),
        name: z.string().optional(),
        picture: z.string().url().optional(),
      }).optional(),
    })
    .describe("Creative specification to validate"),
});

export const UploadCreativeAssetSchema = z.object({
  account_id: z.string().describe("Meta Ad Account ID"),
  asset_type: z
    .enum(["image", "video"])
    .describe("Type of asset to upload"),
  asset_url: z
    .string()
    .url()
    .optional()
    .describe("URL of the asset to upload (for external assets)"),
  asset_name: z
    .string()
    .optional()
    .describe("Name for the uploaded asset"),
});

export const GetCreativeInsightsSchema = z.object({
  creative_id: z.string().describe("Creative ID to analyze"),
  date_preset: z
    .enum([
      "today",
      "yesterday",
      "last_7d",
      "last_14d",
      "last_30d",
      "last_90d",
      "this_month",
      "last_month"
    ])
    .optional()
    .describe("Preset date range for insights"),
  time_range: z
    .object({
      since: z.string().describe("Start date in YYYY-MM-DD format"),
      until: z.string().describe("End date in YYYY-MM-DD format"),
    })
    .optional()
    .describe("Custom date range for insights"),
  fields: z
    .array(z.enum([
      "impressions",
      "clicks",
      "ctr",
      "cpc",
      "spend",
      "reach",
      "frequency",
      "actions",
      "conversions",
      "cost_per_action_type"
    ]))
    .optional()
    .describe("Specific metrics to retrieve"),
});

// Ad Management Schemas
export const ListAdsSchema = z.object({
  adset_id: z.string().optional().describe("Ad set ID to list ads for"),
  campaign_id: z.string().optional().describe("Campaign ID to list ads for"),
  account_id: z.string().optional().describe("Account ID to list ads for"),
  status: z
    .enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"])
    .optional()
    .describe("Filter by ad status"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .describe("Number of ads to return"),
  after: z.string().optional().describe("Pagination cursor for next page"),
});

export const CreateAdSchema = z.object({
  adset_id: z.string().describe("Ad set ID to create ad in"),
  name: z.string().min(1).describe("Ad name"),
  creative_id: z.string().describe("Creative ID to use for this ad"),
  status: z
    .enum(["ACTIVE", "PAUSED"])
    .default("PAUSED")
    .describe("Initial ad status"),
});

export type ListCreativesInput = z.infer<typeof ListCreativesSchema>;
export type CreateAdCreativeInput = z.infer<typeof CreateAdCreativeSchema>;
export type UpdateCreativeInput = z.infer<typeof UpdateCreativeSchema>;
export type DeleteCreativeInput = z.infer<typeof DeleteCreativeSchema>;
export type PreviewAdInput = z.infer<typeof PreviewAdSchema>;
export type ValidateCreativeInput = z.infer<typeof ValidateCreativeSchema>;
export type UploadCreativeAssetInput = z.infer<typeof UploadCreativeAssetSchema>;
export type GetCreativeInsightsInput = z.infer<typeof GetCreativeInsightsSchema>;
export type ListAdsInput = z.infer<typeof ListAdsSchema>;
export type CreateAdInput = z.infer<typeof CreateAdSchema>;