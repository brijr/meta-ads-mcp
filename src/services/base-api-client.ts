/**
 * Base API Client - Handles common HTTP operations and shared functionality
 * Extracted from the massive MetaApiClient to reduce complexity
 */

import fetch from "node-fetch";
import { AuthManager } from "../utils/auth.js";
import { globalRateLimiter } from "../utils/rate-limiter.js";
import { MetaApiErrorHandler, retryWithBackoff } from "../utils/error-handler.js";
import { config } from "../config/index.js";
import { logger, logApiCall, logApiResponse } from "../utils/logger.js";
import type { MetaApiResponse } from "../types/meta-api.js";

export class BaseApiClient {
  protected auth: AuthManager;

  constructor(auth?: AuthManager) {
    this.auth = auth || AuthManager.fromEnvironment();
  }

  get authManager(): AuthManager {
    return this.auth;
  }

  /**
   * Make a standardized API request to Meta Graph API
   */
  protected async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: any,
    accountId?: string,
    isWriteCall: boolean = false
  ): Promise<T> {
    const url = `${config.getBaseUrl()}/${endpoint}`;
    
    logApiCall(method, endpoint, body);

    // Check rate limit if we have an account ID
    if (accountId) {
      await globalRateLimiter.checkRateLimit(accountId, isWriteCall);
    }

    return retryWithBackoff(async () => {
      const headers = this.auth.getAuthHeaders();

      const requestOptions: any = {
        method,
        headers,
      };

      if (body && method !== "GET") {
        if (typeof body === "string") {
          requestOptions.body = body;
          headers["Content-Type"] = "application/x-www-form-urlencoded";
        } else {
          requestOptions.body = JSON.stringify(body);
          headers["Content-Type"] = "application/json";
        }
      }

      const response = await fetch(url, requestOptions);
      const result = await MetaApiErrorHandler.handleResponse(response as any);
      
      logApiResponse(endpoint, !result.error, result);
      return result;
    }, `${method} ${endpoint}`);
  }

  /**
   * Build query string from parameters object
   */
  protected buildQueryString(params: Record<string, any>): string {
    const urlParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          urlParams.set(key, JSON.stringify(value));
        } else if (typeof value === "object") {
          urlParams.set(key, JSON.stringify(value));
        } else {
          urlParams.set(key, String(value));
        }
      }
    }

    return urlParams.toString();
  }

  /**
   * Get formatted account ID for API calls
   */
  protected getFormattedAccountId(accountId: string): string {
    return this.auth.getAccountId(accountId);
  }

  /**
   * Helper for common GET requests with pagination
   */
  protected async getPaginatedData<T>(
    endpoint: string,
    params: Record<string, any> = {},
    accountId?: string
  ): Promise<MetaApiResponse<T>> {
    const query = this.buildQueryString(params);
    const fullEndpoint = query ? `${endpoint}?${query}` : endpoint;
    
    return this.makeRequest<MetaApiResponse<T>>(
      fullEndpoint,
      "GET",
      null,
      accountId
    );
  }

  /**
   * Helper for common POST requests
   */
  protected async postData<T>(
    endpoint: string,
    data: Record<string, any>,
    accountId?: string
  ): Promise<T> {
    const body = this.buildQueryString(data);
    
    return this.makeRequest<T>(
      endpoint,
      "POST",
      body,
      accountId,
      true
    );
  }

  /**
   * Helper for common DELETE requests
   */
  protected async deleteResource<T>(
    endpoint: string,
    accountId?: string
  ): Promise<T> {
    return this.makeRequest<T>(
      endpoint,
      "DELETE",
      null,
      accountId,
      true
    );
  }
}