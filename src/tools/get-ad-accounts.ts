import { z } from "zod";
import { type InferSchema } from "xmcp";
import { MetaContext } from "@/lib/shared/meta-context";

export const schema = {};

export const metadata = {
  name: "get_ad_accounts",
  description: "Get list of accessible Meta ad accounts",
  annotations: {
    title: "Get Ad Accounts",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getAdAccounts(_args: InferSchema<typeof schema>, context: any) {
  const headers = context?.headers || {};
  
  return MetaContext.withClient(headers, async (client) => {
    const accounts = await client.getAdAccounts();

    return {
      accounts: accounts || [],
      count: accounts?.length || 0,
    };
  });
}