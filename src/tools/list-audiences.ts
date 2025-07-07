import { z } from "zod";
import { type InferSchema } from "xmcp";
import { MetaContext } from "@/lib/shared/meta-context";

export const schema = {
  account_id: z.string().describe("The ad account ID"),
  limit: z.number().optional().describe("Number of audiences to return"),
};

export const metadata = {
  name: "list_audiences",
  description: "List custom audiences for an ad account",
  annotations: {
    title: "List Audiences",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function listAudiences({ account_id, limit }: InferSchema<typeof schema>, context: any) {
  const headers = context?.headers || {};
  
  return MetaContext.withClient(headers, async (client) => {
    const audiences = await client.getCustomAudiences(account_id, {
      fields: [
        "id",
        "name",
        "description",
        "approximate_count_lower_bound",
        "approximate_count_upper_bound",
        "data_source",
        "lookalike_spec",
        "operation_status",
        "time_created",
        "time_updated",
      ],
      limit: limit || 50,
    });

    return {
      audiences: audiences.data || [],
      count: audiences.data?.length || 0,
      account_id,
    };
  });
}