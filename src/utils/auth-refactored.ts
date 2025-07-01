/**
 * Refactored AuthManager using centralized configuration
 * Simplified and cleaner than the original implementation
 */

import { config } from "../config/index.js";
import { logger } from "./logger.js";
import type { MetaApiConfig } from "../types/meta-api.js";

export class AuthManager {
  private metaConfig: ReturnType<typeof config.getMeta>;

  constructor(customConfig?: Partial<MetaApiConfig>) {
    // Use centralized config by default, allow override for testing
    this.metaConfig = customConfig ? { ...config.getMeta(), ...customConfig } : config.getMeta();
    this.validateConfig();
  }

  static fromEnvironment(): AuthManager {
    return new AuthManager();
  }

  private validateConfig(): void {
    if (!this.metaConfig.accessToken) {
      throw new Error(
        "Meta access token is required. Set META_ACCESS_TOKEN environment variable."
      );
    }

    if (this.metaConfig.accessToken.length < 10) {
      throw new Error("Invalid Meta access token format.");
    }

    logger.debug("Auth configuration validated successfully");
  }

  getAccessToken(): string {
    return this.metaConfig.accessToken;
  }

  getApiVersion(): string {
    return this.metaConfig.apiVersion;
  }

  getBaseUrl(): string {
    return this.metaConfig.baseUrl;
  }

  getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getAccessToken()}`,
      "Content-Type": "application/json",
      "User-Agent": `meta-ads-mcp/${config.getServer().version}`,
    };
  }

  async validateToken(): Promise<boolean> {
    try {
      logger.debug("Validating Meta access token");
      
      const response = await fetch(
        `${this.getBaseUrl()}/${this.getApiVersion()}/me?access_token=${this.getAccessToken()}`
      );
      
      const isValid = response.ok;
      
      if (isValid) {
        logger.debug("Token validation successful");
      } else {
        logger.warn("Token validation failed", { status: response.status });
      }
      
      return isValid;
    } catch (error) {
      logger.error("Token validation error:", error);
      return false;
    }
  }

  async refreshTokenIfNeeded(): Promise<string> {
    const isValid = await this.validateToken();
    
    if (!isValid) {
      throw new Error("Invalid or expired access token. Please generate a new token.");
    }

    // Check if auto-refresh is enabled and we have the necessary credentials
    if (this.metaConfig.autoRefresh && this.metaConfig.appId && this.metaConfig.appSecret) {
      try {
        await this.attemptTokenRefresh();
      } catch (error) {
        logger.warn("Token refresh failed, but current token is still valid:", error);
      }
    }

    return this.getAccessToken();
  }

  private async attemptTokenRefresh(): Promise<void> {
    if (!this.metaConfig.appId || !this.metaConfig.appSecret) {
      throw new Error("App ID and App Secret required for token refresh");
    }

    logger.debug("Attempting token refresh");

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${this.metaConfig.appId}&` +
        `client_secret=${this.metaConfig.appSecret}&` +
        `fb_exchange_token=${this.getAccessToken()}`
      );

      if (response.ok) {
        const data = await response.json() as any;
        if (data.access_token) {
          // In a real implementation, you'd update the stored token
          logger.info("Token refresh successful");
        }
      } else {
        throw new Error(`Token refresh failed: ${response.status}`);
      }
    } catch (error) {
      logger.error("Token refresh error:", error);
      throw error;
    }
  }

  getAccountId(accountId: string): string {
    // Handle both raw account IDs and formatted ones
    return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  }

  hasOAuthCredentials(): boolean {
    return !!(this.metaConfig.appId && this.metaConfig.appSecret);
  }

  isAutoRefreshEnabled(): boolean {
    return this.metaConfig.autoRefresh;
  }

  getAppId(): string | undefined {
    return this.metaConfig.appId;
  }

  getAppSecret(): string | undefined {
    return this.metaConfig.appSecret;
  }

  getBusinessId(): string | undefined {
    return this.metaConfig.businessId;
  }

  getRedirectUri(): string | undefined {
    return this.metaConfig.redirectUri;
  }

  // Additional compatibility properties and methods
  get config() {
    return {
      accessToken: this.metaConfig.accessToken,
      appId: this.metaConfig.appId,
      appSecret: this.metaConfig.appSecret,
      apiVersion: this.metaConfig.apiVersion,
      baseUrl: this.metaConfig.baseUrl,
    };
  }

  extractAccountNumber(accountId: string): string {
    return accountId.startsWith("act_") ? accountId.substring(4) : accountId;
  }

  async generateAuthUrl(scope: string = "ads_read,ads_management", state?: string): Promise<string> {
    if (!this.metaConfig.appId || !this.metaConfig.redirectUri) {
      throw new Error("App ID and redirect URI required for OAuth URL generation");
    }

    const params = new URLSearchParams({
      client_id: this.metaConfig.appId,
      redirect_uri: this.metaConfig.redirectUri,
      scope,
      response_type: "code",
    });

    if (state) {
      params.set("state", state);
    }

    return `https://www.facebook.com/v${this.metaConfig.apiVersion.replace('v', '')}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{ access_token: string; token_type: string }> {
    if (!this.metaConfig.appId || !this.metaConfig.appSecret || !this.metaConfig.redirectUri) {
      throw new Error("App ID, App Secret, and redirect URI required for token exchange");
    }

    const params = new URLSearchParams({
      client_id: this.metaConfig.appId,
      client_secret: this.metaConfig.appSecret,
      redirect_uri: this.metaConfig.redirectUri,
      code,
    });

    const response = await fetch(
      `${this.metaConfig.baseUrl}/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json() as any;
  }

  async refreshToLongLivedToken(shortLivedToken: string): Promise<{ access_token: string; expires_in: number }> {
    if (!this.metaConfig.appId || !this.metaConfig.appSecret) {
      throw new Error("App ID and App Secret required for token refresh");
    }

    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: this.metaConfig.appId,
      client_secret: this.metaConfig.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(
      `${this.metaConfig.baseUrl}/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return response.json() as any;
  }

  async generateSystemUserToken(businessId: string, systemUserId: string, scope: string = "ads_read,ads_management"): Promise<{ access_token: string }> {
    if (!this.metaConfig.appId || !this.metaConfig.appSecret) {
      throw new Error("App ID and App Secret required for system user token generation");
    }

    const params = new URLSearchParams({
      access_token: `${this.metaConfig.appId}|${this.metaConfig.appSecret}`,
    });

    const response = await fetch(
      `${this.metaConfig.baseUrl}/${businessId}/${systemUserId}/access_tokens?${params.toString()}`,
      { method: "POST" }
    );

    if (!response.ok) {
      throw new Error(`System user token generation failed: ${response.statusText}`);
    }

    return response.json() as any;
  }

  async getTokenInfo(token?: string): Promise<any> {
    const tokenToCheck = token || this.metaConfig.accessToken;
    const response = await fetch(
      `${this.metaConfig.baseUrl}/debug_token?input_token=${tokenToCheck}&access_token=${this.metaConfig.accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Token info retrieval failed: ${response.statusText}`);
    }

    return response.json();
  }
}