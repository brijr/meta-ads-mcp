import { z } from "zod";
import { type InferSchema } from "xmcp";
import { MetaContext } from "@/lib/shared/meta-context";

export const schema = {
  campaign_id: z.string().describe("Campaign ID to resume"),
};

export const metadata = {
  name: "resume_campaign",
  description: "Resume/activate a paused campaign",
  annotations: {
    title: "Resume Campaign",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function resumeCampaign({ campaign_id }: InferSchema<typeof schema>, context: any) {
  const headers = context?.headers || {};
  
  return MetaContext.withClient(headers, async (client) => {
    await client.updateCampaign(campaign_id, {
      status: "ACTIVE",
    });

    return {
      success: true,
      message: "Campaign resumed successfully",
      campaign_id,
      status: "ACTIVE",
    };
  });
}