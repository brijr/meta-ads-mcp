import { z } from "zod";
import { type InferSchema } from "xmcp";
import { MetaContext } from "@/lib/shared/meta-context";

export const schema = {
  account_id: z.string().describe("The ad account ID"),
  limit: z.number().optional().describe("Number of creatives to return"),
};

export const metadata = {
  name: "list_ad_creatives",
  description: "List ad creatives for an account",
  annotations: {
    title: "List Ad Creatives",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function listAdCreatives({ account_id, limit }: InferSchema<typeof schema>, context: any) {
  const headers = context?.headers || {};
  
  return MetaContext.withClient(headers, async (client) => {
    const creatives = await client.getAdCreatives(account_id, {
      fields: [
        "id",
        "name",
        "status",
        "body",
        "title",
        "call_to_action_type",
        "image_url",
        "thumbnail_url",
        "video_id",
        "object_type",
        "created_time",
        "updated_time",
      ],
      limit: limit || 50,
    });

    return {
      creatives: creatives.data || [],
      count: creatives.data?.length || 0,
      account_id,
    };
  });
}