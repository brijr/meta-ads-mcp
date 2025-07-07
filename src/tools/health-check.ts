import { z } from "zod";
import { type InferSchema } from "xmcp";
import { XMCPAuthMiddleware } from "@/lib/shared/auth-middleware";

export const schema = {};

export const metadata = {
  name: "health_check",
  description: "Check server health and authentication status",
  annotations: {
    title: "Health Check",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function healthCheck(_args: InferSchema<typeof schema>, context: any) {
  const startTime = Date.now();
  
  try {
    const responseTime = Date.now() - startTime;
    
    // Get authentication context if available
    const headers = context?.headers || {};
    const auth = await XMCPAuthMiddleware.getAuthContext(headers);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              server_name: "Offer Arc Meta Marketing API",
              version: "2.0.0",
              timestamp: new Date().toISOString(),
              response_time_ms: responseTime,
              status: "healthy",
              message: "MCP server is running with xmcp adapter",
              authentication: {
                authenticated: !!auth,
                userId: auth?.userId || null,
                orgId: auth?.orgId || null,
              },
              endpoints: {
                http: `${
                  process.env.NEXT_PUBLIC_APP_URL || "https://offerarc.com"
                }/mcp`,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return XMCPAuthMiddleware.createErrorResponse(error, "Health check failed");
  }
}