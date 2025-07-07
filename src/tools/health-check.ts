import { z } from "zod";
import { type InferSchema } from "xmcp";
import { XMCPAuthMiddleware } from "@/lib/shared/xmcp-auth-middleware";

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
    const authResult = await XMCPAuthMiddleware.validateAccessToken(headers);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              server_name: "Meta MCP Server",
              version: "1.0.0",
              timestamp: new Date().toISOString(),
              response_time_ms: responseTime,
              status: "healthy",
              message: "Meta MCP server is running with OAuth authentication",
              authentication: {
                authenticated: authResult.isValid,
                userId: authResult.userId || null,
                error: authResult.error || null,
              },
              endpoints: {
                http: `http://localhost:3002`,
                oauth: `http://localhost:3003`,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }
}