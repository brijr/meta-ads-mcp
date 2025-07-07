import { z } from "zod";
import { type InferSchema } from "xmcp";
import { MetaContext } from "@/lib/shared/meta-context";

export const schema = {
  object_id: z.string().describe("The ID of the campaign, ad set, or ad"),
  level: z
    .enum(["account", "campaign", "adset", "ad"])
    .describe("The level of insights to retrieve"),
  date_preset: z
    .string()
    .optional()
    .describe("Date preset like 'last_7d', 'last_30d'"),
  fields: z
    .array(z.string())
    .optional()
    .describe("Specific metrics to retrieve"),
  limit: z.number().optional().describe("Number of results to return"),
};

export const metadata = {
  name: "get_insights",
  description: "Get performance insights for campaigns, ad sets, or ads",
  annotations: {
    title: "Get Insights",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getInsights({
  object_id,
  level,
  date_preset,
  fields,
  limit,
}: InferSchema<typeof schema>, context: any) {
  const headers = context?.headers || {};
  
  return MetaContext.withClient(headers, async (client) => {
    const defaultFields = [
      "impressions",
      "clicks",
      "spend",
      "ctr",
      "cpc",
      "cpm",
      "reach",
    ];

    const params: Record<string, any> = {
      fields: fields || defaultFields,
      level,
      time_range: date_preset ? { date_preset } : undefined,
      limit: limit || 100,
    };

    const insights = await client.getInsights(object_id, params);

    return {
      insights: insights.data || [],
      count: insights.data?.length || 0,
      object_id,
      level,
    };
  });
}