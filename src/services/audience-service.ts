/**
 * Audience Service - Focused service for custom and lookalike audience operations
 * Extracted from MetaApiClient for better separation of concerns
 */

import { BaseApiClient } from "./base-api-client.js";
import { PaginationHelper, type PaginationParams, type PaginatedResult } from "../utils/pagination.js";
import type { CustomAudience, MetaApiResponse } from "../types/meta-api.js";

export class AudienceService extends BaseApiClient {

  async getCustomAudiences(
    accountId: string,
    params: PaginationParams & { fields?: string[] } = {}
  ): Promise<PaginatedResult<CustomAudience>> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    const { fields, ...paginationParams } = params;

    const queryParams: Record<string, any> = {
      fields:
        fields?.join(",") ||
        "id,name,description,subtype,approximate_count,data_source,retention_days,creation_time,operation_status",
      ...paginationParams,
    };

    const response = await this.getPaginatedData<CustomAudience>(
      `${formattedAccountId}/customaudiences`,
      queryParams,
      formattedAccountId
    );

    return PaginationHelper.parsePaginatedResponse(response);
  }

  async getCustomAudience(audienceId: string): Promise<CustomAudience> {
    const fields = "id,name,description,approximate_count,delivery_status,operation_status";
    
    return this.makeRequest<CustomAudience>(`${audienceId}?fields=${fields}`);
  }

  async createCustomAudience(
    accountId: string,
    audienceData: {
      name: string;
      description?: string;
      subtype: string;
      customer_file_source?: string;
      retention_days?: number;
      rule?: any;
    }
  ): Promise<{ id: string }> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    
    return this.postData<{ id: string }>(
      `${formattedAccountId}/customaudiences`,
      audienceData,
      formattedAccountId
    );
  }

  async createLookalikeAudience(
    accountId: string,
    audienceData: {
      name: string;
      origin_audience_id: string;
      country: string;
      ratio: number;
      description?: string;
    }
  ): Promise<{ id: string }> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    
    const requestData = {
      ...audienceData,
      subtype: "LOOKALIKE",
      lookalike_spec: {
        ratio: audienceData.ratio,
        country: audienceData.country,
        type: "similarity",
      },
    };

    return this.postData<{ id: string }>(
      `${formattedAccountId}/customaudiences`,
      requestData,
      formattedAccountId
    );
  }

  async updateCustomAudience(
    audienceId: string,
    updates: {
      name?: string;
      description?: string;
      retention_days?: number;
    }
  ): Promise<{ success: boolean }> {
    return this.postData<{ success: boolean }>(audienceId, updates);
  }

  async deleteCustomAudience(audienceId: string): Promise<{ success: boolean }> {
    return this.deleteResource<{ success: boolean }>(audienceId);
  }

  async estimateAudienceSize(
    accountId: string,
    targeting: any,
    optimizationGoal: string
  ): Promise<{ estimate_mau: number; estimate_dau?: number }> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    
    const queryParams = {
      targeting_spec: targeting,
      optimization_goal: optimizationGoal,
    };

    const response = await this.getPaginatedData<{ estimate_mau: number; estimate_dau?: number }>(
      `${formattedAccountId}/delivery_estimate`,
      queryParams,
      formattedAccountId
    );

    return response as any; // The API returns the estimate directly
  }

  async getAudienceInsights(
    audienceId: string,
    params: {
      fields?: string[];
      date_preset?: string;
      time_range?: { since: string; until: string };
    } = {}
  ): Promise<any> {
    const queryParams = {
      fields: params.fields?.join(",") || "audience_size,reach_estimate,targeting_expansion",
      ...params,
    };

    return this.getPaginatedData(
      `${audienceId}/insights`,
      queryParams
    );
  }

  async refreshCustomAudience(audienceId: string): Promise<{ success: boolean }> {
    return this.postData<{ success: boolean }>(
      `${audienceId}`,
      { operation: "refresh" }
    );
  }

  async getAudienceDeliveryEstimate(
    accountId: string,
    targetingSpec: any,
    optimizationGoal: string
  ): Promise<{
    estimate_mau: number;
    estimate_dau?: number;
    estimate_ready: boolean;
    unsupported: string[];
  }> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    
    const queryParams = {
      targeting_spec: JSON.stringify(targetingSpec),
      optimization_goal: optimizationGoal,
    };

    return this.getPaginatedData(
      `${formattedAccountId}/delivery_estimate`,
      queryParams,
      formattedAccountId
    ) as any;
  }

  async validateTargeting(
    accountId: string,
    targetingSpec: any
  ): Promise<{
    is_valid: boolean;
    issues?: string[];
    suggestions?: string[];
  }> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    
    try {
      await this.getAudienceDeliveryEstimate(
        accountId,
        targetingSpec,
        "LINK_CLICKS" // Use a default optimization goal for validation
      );
      
      return { is_valid: true };
    } catch (error) {
      return {
        is_valid: false,
        issues: [error instanceof Error ? error.message : "Invalid targeting specification"],
      };
    }
  }
}