import { z } from "zod";
import { type InferSchema } from "xmcp";
import { MetaContext } from "@/lib/shared/meta-context";

export const schema = {
  account_id: z.string().describe("The ad account ID"),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of campaigns to return (default: 25)"),
  status: z
    .string()
    .optional()
    .describe("Filter by campaign status (ACTIVE, PAUSED, etc.)"),
};

export const metadata = {
  name: "get_campaigns",
  description: "Get campaigns for an ad account",
  annotations: {
    title: "Get Campaigns",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getCampaigns(
  { account_id, limit, status }: InferSchema<typeof schema>,
  context: any,
) {
  const headers = context?.headers || {};

  return MetaContext.withClient(headers, async (client) => {
    const filters: Record<string, string[]> = {};
    if (status) {
      filters.effective_status = [status];
    }

    const campaigns = await client.getCampaigns(account_id, {
      fields: [
        "id",
        "name",
        "status",
        "effective_status",
        "objective",
        "daily_budget",
        "lifetime_budget",
        "created_time",
        "updated_time",
      ],
      limit: limit || 25,
      filtering: filters,
    });

    return {
      campaigns: campaigns.data || [],
      count: campaigns.data?.length || 0,
      account_id,
    };
  });
}
