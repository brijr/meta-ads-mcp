import { z } from "zod";
import { type InferSchema } from "xmcp";
import { MetaContext } from "@/lib/shared/meta-context";

export const schema = {
  campaign_id: z.string().describe("Campaign ID to pause"),
};

export const metadata = {
  name: "pause_campaign",
  description: "Pause a campaign",
  annotations: {
    title: "Pause Campaign",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function pauseCampaign({ campaign_id }: InferSchema<typeof schema>, context: any) {
  const headers = context?.headers || {};
  
  return MetaContext.withClient(headers, async (client) => {
    await client.updateCampaign(campaign_id, {
      status: "PAUSED",
    });

    return {
      success: true,
      message: "Campaign paused successfully",
      campaign_id,
      status: "PAUSED",
    };
  });
}