import { z } from "zod";
import { type InferSchema } from "xmcp";
import { MetaContext } from "@/lib/shared/meta-context";

export const schema = {
  account_id: z.string().describe("The ad account ID"),
  name: z.string().describe("Campaign name"),
  objective: z
    .string()
    .describe(
      "Campaign objective (OUTCOME_TRAFFIC, OUTCOME_LEADS, etc.)"
    ),
  status: z
    .enum(["ACTIVE", "PAUSED"])
    .optional()
    .describe("Campaign status"),
  budget_optimization: z
    .boolean()
    .optional()
    .describe("Enable campaign budget optimization"),
  daily_budget: z.number().optional().describe("Daily budget in cents"),
  lifetime_budget: z
    .number()
    .optional()
    .describe("Lifetime budget in cents"),
};

export const metadata = {
  name: "create_campaign",
  description: "Create a new advertising campaign",
  annotations: {
    title: "Create Campaign",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export default async function createCampaign({
  account_id,
  name,
  objective,
  status,
  budget_optimization,
  daily_budget,
  lifetime_budget,
}: InferSchema<typeof schema>, context: any) {
  const headers = context?.headers || {};
  
  return MetaContext.withClient(headers, async (client) => {
    const params: Record<string, any> = {
      name,
      objective,
      status: status || "PAUSED",
    };

    if (budget_optimization !== undefined) {
      params.is_budget_optimization_enabled = budget_optimization;
    }

    if (daily_budget) {
      params.daily_budget = daily_budget;
    }

    if (lifetime_budget) {
      params.lifetime_budget = lifetime_budget;
    }

    const campaign = await client.createCampaign(account_id, params);

    return {
      campaign,
      message: "Campaign created successfully",
    };
  });
}