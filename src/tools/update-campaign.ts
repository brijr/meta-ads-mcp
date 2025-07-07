import { z } from "zod";
import { type InferSchema } from "xmcp";
import { MetaContext } from "@/lib/shared/meta-context";

export const schema = {
  campaign_id: z.string().describe("Campaign ID to update"),
  name: z.string().optional().describe("New campaign name"),
  status: z
    .enum(["ACTIVE", "PAUSED"])
    .optional()
    .describe("Campaign status"),
  daily_budget: z.number().optional().describe("Daily budget in cents"),
  lifetime_budget: z
    .number()
    .optional()
    .describe("Lifetime budget in cents"),
};

export const metadata = {
  name: "update_campaign",
  description: "Update an existing campaign",
  annotations: {
    title: "Update Campaign",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export default async function updateCampaign({
  campaign_id,
  name,
  status,
  daily_budget,
  lifetime_budget,
}: InferSchema<typeof schema>, context: any) {
  const headers = context?.headers || {};
  
  return MetaContext.withClient(headers, async (client) => {
    const params: Record<string, any> = {};

    if (name) params.name = name;
    if (status) params.status = status;
    if (daily_budget) params.daily_budget = daily_budget;
    if (lifetime_budget) params.lifetime_budget = lifetime_budget;

    await client.updateCampaign(campaign_id, params);

    return {
      success: true,
      message: "Campaign updated successfully",
      campaign_id,
      updates: params,
    };
  });
}