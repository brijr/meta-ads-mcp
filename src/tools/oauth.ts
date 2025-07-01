import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AuthManager } from "../utils/auth.js";
import {
  GenerateAuthUrlSchema,
  ExchangeCodeForTokenSchema,
  RefreshToLongLivedTokenSchema,
  GenerateSystemUserTokenSchema,
} from "../types/schemas.js";

export function registerOAuthTools(
  server: McpServer,
  authManager: AuthManager
) {
  // Generate OAuth Authorization URL Tool
  server.tool(
    "generate_auth_url",
    GenerateAuthUrlSchema.shape,
    async ({ scope, state }) => {
      try {
        const authUrl = await authManager.generateAuthUrl(scope, state);

        const response = {
          success: true,
          authorization_url: authUrl,
          scopes_requested: scope,
          instructions: [
            "1. Open the authorization URL in a web browser",
            "2. Log in to your Facebook account",
            "3. Grant the requested permissions to your app",
            "4. Copy the authorization code from the redirect URL",
            "5. Use the 'exchange_code_for_token' tool with the authorization code",
          ],
          security_note: state
            ? "State parameter included for CSRF protection"
            : "Consider adding a state parameter for additional security",
          redirect_uri: authManager.getRedirectUri(),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error generating authorization URL: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Exchange Authorization Code for Token Tool
  server.tool(
    "exchange_code_for_token",
    ExchangeCodeForTokenSchema.shape,
    async ({ code }) => {
      try {
        const result = await authManager.exchangeCodeForToken(code);

        const response = {
          success: true,
          message: "Authorization code exchanged successfully",
          token_info: {
            access_token: result.access_token,
            token_type: result.token_type,
            expires_in: undefined,
            expires_at: undefined,
          },
          next_steps: [
            "Token is now active and will be used for API calls",
            "Consider exchanging for a long-lived token using 'refresh_to_long_lived_token'",
            "Store the token securely for future use",
          ],
          recommendations: [
            "Long-lived tokens last ~60 days vs ~1-2 hours for short-lived tokens",
            "Enable auto-refresh by setting META_AUTO_REFRESH=true",
            "Monitor token expiration and refresh before it expires",
          ],
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error exchanging authorization code: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Refresh to Long-Lived Token Tool
  server.tool(
    "refresh_to_long_lived_token",
    RefreshToLongLivedTokenSchema.shape,
    async ({ short_lived_token }) => {
      try {
        const result = await authManager.exchangeForLongLivedToken(
          short_lived_token
        );

        const response = {
          success: true,
          message: "Token successfully exchanged for long-lived token",
          token_info: {
            access_token: result.access_token,
            token_type: "Bearer",
            expires_in: result.expires_in,
            expires_at: new Date(
              Date.now() + result.expires_in * 1000
            ).toISOString(),
            lifetime: "Approximately 60 days",
          },
          token_management: {
            auto_refresh_enabled: authManager.isAutoRefreshEnabled(),
            current_expiration: undefined,
            refresh_recommendation:
              "Set up automatic refresh or manually refresh before expiration",
          },
          environment_variables: {
            META_ACCESS_TOKEN: "Update with the new long-lived token",
            META_AUTO_REFRESH: "Set to 'true' to enable automatic refresh",
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error refreshing to long-lived token: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Generate System User Token Tool
  server.tool(
    "generate_system_user_token",
    GenerateSystemUserTokenSchema.shape,
    async ({ system_user_id, scope, business_id }) => {
      try {
        const result = await authManager.generateSystemUserToken(
          business_id,
          system_user_id,
          scope
        );

        const response = {
          success: true,
          message: `System user token generated successfully`,
          system_user_id,
          token_info: {
            access_token: result.access_token,
            token_type: "Bearer",
            expires_in: undefined,
            expires_at: "Never (non-expiring token)",
            scopes: scope,
          },
          token_characteristics: {
            type: "Non-expiring",
            use_case: "Server-to-server automation",
            security_level: "High - requires Business Manager admin access",
          },
          recommendations: [
            "Store the system user token securely",
            "Use for automated, server-side operations",
            "Monitor token usage and permissions",
            "Non-expiring tokens require manual revocation if compromised",
          ],
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error generating system user token: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get Token Info Tool
  server.tool(
    "get_token_info",
    {},
    async () => {
      try {
        const tokenInfo = await authManager.getTokenInfo();

        const response = {
          token_info: tokenInfo,
          current_config: {
            has_app_credentials: authManager.hasOAuthCredentials(),
            has_redirect_uri: !!authManager.getRedirectUri(),
            auto_refresh_enabled: authManager.isAutoRefreshEnabled(),
            token_expiration: undefined,
          },
          token_status: {
            is_valid: tokenInfo.isValid,
            is_expiring_soon: authManager.isTokenExpiring(),
            requires_refresh: authManager.isTokenExpiring(),
          },
          recommendations: generateTokenRecommendations(tokenInfo, authManager),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error getting token info: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Validate Current Token Tool
  server.tool(
    "validate_token",
    {},
    async () => {
      try {
        const isValid = await authManager.validateToken();
        const tokenInfo = await authManager.getTokenInfo();

        const response = {
          is_valid: isValid,
          validation_timestamp: new Date().toISOString(),
          token_details: tokenInfo,
          health_check: {
            api_connectivity: isValid,
            token_format: !!authManager.getAccessToken(),
            permissions: tokenInfo.scopes || [],
          },
          diagnostics: {
            token_length: authManager.getAccessToken().length,
            expires_at: tokenInfo.expiresAt?.toISOString(),
            user_id: tokenInfo.userId,
            app_id: tokenInfo.appId,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error validating token: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Helper function to generate token recommendations
function generateTokenRecommendations(
  tokenInfo: any,
  authManager: AuthManager
): string[] {
  const recommendations: string[] = [];

  if (!tokenInfo.isValid) {
    recommendations.push("Token is invalid - obtain a new token immediately");
    recommendations.push("Check app credentials and permissions");
  }

  if (authManager.isTokenExpiring()) {
    recommendations.push("Token may be expiring - consider refreshing");
  }

  if (!authManager.isAutoRefreshEnabled()) {
    recommendations.push("Enable auto-refresh to prevent token expiration");
    recommendations.push("Set META_AUTO_REFRESH=true in environment variables");
  }

  if (!authManager.hasOAuthCredentials()) {
    recommendations.push("Configure app credentials for token refresh capabilities");
    recommendations.push("Set META_APP_ID and META_APP_SECRET environment variables");
  }

  if (!tokenInfo.scopes || tokenInfo.scopes.length === 0) {
    recommendations.push("No scopes detected - verify token permissions");
  }

  if (tokenInfo.scopes && !tokenInfo.scopes.includes("ads_management")) {
    recommendations.push("ads_management scope missing - required for Marketing API");
  }

  if (tokenInfo.expiresAt) {
    const daysUntilExpiration = Math.ceil(
      (new Date(tokenInfo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiration < 7) {
      recommendations.push(`Token expires in ${daysUntilExpiration} days - plan renewal`);
    }
  }

  return recommendations;
}