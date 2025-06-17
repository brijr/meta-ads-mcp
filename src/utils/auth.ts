import type { MetaApiConfig } from "../types/meta-api.js";

export class AuthManager {
  private config: MetaApiConfig;

  constructor(config: MetaApiConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    // Access token is now optional at startup, can be provided per-request
    if (this.config.accessToken && this.config.accessToken.length < 10) {
      throw new Error("Invalid Meta access token format.");
    }
  }

  getAccessToken(providedToken?: string): string {
    const token = providedToken || this.config.accessToken;
    if (!token) {
      throw new Error("Access token is required. Provide via parameter or META_ACCESS_TOKEN environment variable.");
    }
    return token;
  }

  getApiVersion(): string {
    return this.config.apiVersion || "v23.0";
  }

  getBaseUrl(): string {
    return this.config.baseUrl || "https://graph.facebook.com";
  }

  getAuthHeaders(providedToken?: string): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getAccessToken(providedToken)}`,
      "Content-Type": "application/json",
      "User-Agent": "meta-ads-mcp/1.0.0",
    };
  }

  async validateToken(providedToken?: string): Promise<boolean> {
    try {
      const token = this.getAccessToken(providedToken);
      const response = await fetch(
        `${this.getBaseUrl()}/${this.getApiVersion()}/me?access_token=${token}`
      );
      return response.ok;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }

  static fromEnvironment(): AuthManager {
    const config: MetaApiConfig = {
      accessToken: process.env.META_ACCESS_TOKEN || "",
      appId: process.env.META_APP_ID,
      appSecret: process.env.META_APP_SECRET,
      businessId: process.env.META_BUSINESS_ID,
      apiVersion: process.env.META_API_VERSION,
      baseUrl: process.env.META_BASE_URL,
    };

    return new AuthManager(config);
  }

  async refreshTokenIfNeeded(providedToken?: string): Promise<string> {
    const token = this.getAccessToken(providedToken);
    const isValid = await this.validateToken(providedToken);
    if (!isValid) {
      throw new Error(
        "Access token is invalid or expired. Please generate a new token."
      );
    }
    return token;
  }

  getAccountId(accountIdOrNumber: string): string {
    if (accountIdOrNumber.startsWith("act_")) {
      return accountIdOrNumber;
    }
    return `act_${accountIdOrNumber}`;
  }

  extractAccountNumber(accountId: string): string {
    if (accountId.startsWith("act_")) {
      return accountId.substring(4);
    }
    return accountId;
  }
}
