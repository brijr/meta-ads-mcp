/**
 * Analytics Service - Focused service for insights and performance data
 * Extracted from MetaApiClient for better separation of concerns
 */

import { BaseApiClient } from "./base-api-client.js";
import { PaginationHelper, type PaginationParams, type PaginatedResult } from "../utils/pagination.js";
import type { AdInsights, MetaApiResponse } from "../types/meta-api.js";

export class AnalyticsService extends BaseApiClient {

  async getInsights(
    objectId: string,
    params: {
      level?: "account" | "campaign" | "adset" | "ad";
      date_preset?: string;
      time_range?: { since: string; until: string };
      fields?: string[];
      breakdowns?: string[];
      limit?: number;
      after?: string;
    } = {}
  ): Promise<PaginatedResult<AdInsights>> {
    const queryParams: Record<string, any> = {
      fields:
        params.fields?.join(",") ||
        "impressions,clicks,spend,reach,frequency,ctr,cpc,cpm,actions,cost_per_action_type",
      ...params,
    };

    if (params.time_range) {
      queryParams.time_range = params.time_range;
    }

    const response = await this.getPaginatedData<AdInsights>(
      `${objectId}/insights`,
      queryParams
    );

    return PaginationHelper.parsePaginatedResponse(response);
  }

  async getAccountInsights(
    accountId: string,
    params: {
      date_preset?: string;
      time_range?: { since: string; until: string };
      fields?: string[];
      breakdowns?: string[];
      limit?: number;
      after?: string;
    } = {}
  ): Promise<PaginatedResult<AdInsights>> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    
    return this.getInsights(formattedAccountId, {
      level: "account",
      ...params,
    });
  }

  async getCampaignInsights(
    campaignId: string,
    params: {
      date_preset?: string;
      time_range?: { since: string; until: string };
      fields?: string[];
      breakdowns?: string[];
      limit?: number;
      after?: string;
    } = {}
  ): Promise<PaginatedResult<AdInsights>> {
    return this.getInsights(campaignId, {
      level: "campaign",
      ...params,
    });
  }

  async getAdSetInsights(
    adSetId: string,
    params: {
      date_preset?: string;
      time_range?: { since: string; until: string };
      fields?: string[];
      breakdowns?: string[];
      limit?: number;
      after?: string;
    } = {}
  ): Promise<PaginatedResult<AdInsights>> {
    return this.getInsights(adSetId, {
      level: "adset",
      ...params,
    });
  }

  async getAdInsights(
    adId: string,
    params: {
      date_preset?: string;
      time_range?: { since: string; until: string };
      fields?: string[];
      breakdowns?: string[];
      limit?: number;
      after?: string;
    } = {}
  ): Promise<PaginatedResult<AdInsights>> {
    return this.getInsights(adId, {
      level: "ad",
      ...params,
    });
  }

  async comparePerformance(
    objectIds: string[],
    params: {
      level?: "account" | "campaign" | "adset" | "ad";
      date_preset?: string;
      time_range?: { since: string; until: string };
      fields?: string[];
    } = {}
  ): Promise<{ [objectId: string]: AdInsights[] }> {
    const results: { [objectId: string]: AdInsights[] } = {};

    // Get insights for each object in parallel
    const promises = objectIds.map(async (objectId) => {
      const insights = await this.getInsights(objectId, params);
      return { objectId, data: insights.data };
    });

    const responses = await Promise.all(promises);
    
    for (const response of responses) {
      results[response.objectId] = response.data;
    }

    return results;
  }

  async getAttributionData(
    objectId: string,
    params: {
      attribution_windows?: string[];
      date_preset?: string;
      time_range?: { since: string; until: string };
      fields?: string[];
    } = {}
  ): Promise<PaginatedResult<AdInsights>> {
    const queryParams = {
      ...params,
      fields: params.fields?.join(",") || "actions,cost_per_action_type,conversions,conversion_values",
    };

    const response = await this.getPaginatedData<AdInsights>(
      `${objectId}/insights`,
      queryParams
    );

    return PaginationHelper.parsePaginatedResponse(response);
  }

  async exportInsights(
    objectId: string,
    format: "json" | "csv",
    params: {
      level?: "account" | "campaign" | "adset" | "ad";
      date_preset?: string;
      time_range?: { since: string; until: string };
      fields?: string[];
      breakdowns?: string[];
    } = {}
  ): Promise<{ data: any; format: string; timestamp: string }> {
    const insights = await this.getInsights(objectId, params);
    
    const exportData = {
      data: format === "csv" ? this.convertToCSV(insights.data) : insights.data,
      format,
      timestamp: new Date().toISOString(),
      total_records: insights.data.length,
      exported_object: objectId,
      parameters: params,
    };

    return exportData;
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) {
      return "";
    }

    // Get all unique keys from the data
    const keys = Array.from(
      new Set(data.flatMap(item => Object.keys(item)))
    );

    // Create CSV header
    const header = keys.join(",");

    // Create CSV rows
    const rows = data.map(item => 
      keys.map(key => {
        const value = item[key];
        if (value === null || value === undefined) {
          return "";
        }
        // Escape commas and quotes in values
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(",")
    );

    return [header, ...rows].join("\n");
  }
}