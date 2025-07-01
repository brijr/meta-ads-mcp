/**
 * Campaign Service - Focused service for campaign, ad set, and ad operations
 * Extracted from MetaApiClient to improve separation of concerns
 */

import { BaseApiClient } from "./base-api-client.js";
import { PaginationHelper, type PaginationParams, type PaginatedResult } from "../utils/pagination.js";
import { logger } from "../utils/logger.js";
import type { Campaign, AdSet, Ad } from "../types/meta-api.js";

export class CampaignService extends BaseApiClient {
  
  // Campaign Methods
  async getCampaigns(
    accountId: string,
    params: PaginationParams & { status?: string; fields?: string[] } = {}
  ): Promise<PaginatedResult<Campaign>> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    const { status, fields, ...paginationParams } = params;

    const queryParams: Record<string, any> = {
      fields:
        fields?.join(",") ||
        "id,name,objective,status,effective_status,created_time,updated_time,start_time,stop_time,budget_remaining,daily_budget,lifetime_budget",
      ...paginationParams,
    };

    if (status) {
      queryParams.effective_status = JSON.stringify([status]);
    }

    const response = await this.getPaginatedData<Campaign>(
      `${formattedAccountId}/campaigns`,
      queryParams,
      formattedAccountId
    );

    return PaginationHelper.parsePaginatedResponse(response);
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    const fields = "id,name,objective,status,effective_status,created_time,updated_time,start_time,stop_time,budget_remaining,daily_budget,lifetime_budget,account_id";
    
    return this.makeRequest<Campaign>(`${campaignId}?fields=${fields}`);
  }

  async createCampaign(
    accountId: string,
    campaignData: {
      name: string;
      objective: string;
      status?: string;
      daily_budget?: number;
      lifetime_budget?: number;
      start_time?: string;
      stop_time?: string;
      special_ad_categories?: string[];
      bid_strategy?: string;
      bid_cap?: number;
      is_budget_optimization_enabled?: boolean;
    }
  ): Promise<{ id: string }> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    
    return this.postData<{ id: string }>(
      `${formattedAccountId}/campaigns`,
      campaignData,
      formattedAccountId
    );
  }

  async updateCampaign(
    campaignId: string,
    updates: {
      name?: string;
      status?: string;
      daily_budget?: number;
      lifetime_budget?: number;
      start_time?: string;
      stop_time?: string;
    }
  ): Promise<{ success: boolean }> {
    return this.postData<{ success: boolean }>(campaignId, updates);
  }

  async deleteCampaign(campaignId: string): Promise<{ success: boolean }> {
    return this.deleteResource<{ success: boolean }>(campaignId);
  }

  // Ad Set Methods
  async getAdSets(
    params: PaginationParams & {
      campaignId?: string;
      accountId?: string;
      status?: string;
      fields?: string[];
    } = {}
  ): Promise<PaginatedResult<AdSet>> {
    const { campaignId, accountId, status, fields, ...paginationParams } = params;

    let endpoint: string;
    let rateLimitAccountId: string | undefined;

    if (campaignId) {
      endpoint = `${campaignId}/adsets`;
    } else if (accountId) {
      const formattedAccountId = this.getFormattedAccountId(accountId);
      endpoint = `${formattedAccountId}/adsets`;
      rateLimitAccountId = formattedAccountId;
    } else {
      throw new Error("Either campaignId or accountId must be provided");
    }

    const queryParams: Record<string, any> = {
      fields:
        fields?.join(",") ||
        "id,name,campaign_id,status,effective_status,created_time,updated_time,start_time,end_time,daily_budget,lifetime_budget,bid_amount,billing_event,optimization_goal",
      ...paginationParams,
    };

    if (status) {
      queryParams.effective_status = JSON.stringify([status]);
    }

    const response = await this.getPaginatedData<AdSet>(
      endpoint,
      queryParams,
      rateLimitAccountId
    );

    return PaginationHelper.parsePaginatedResponse(response);
  }

  async createAdSet(
    campaignId: string,
    adSetData: {
      name: string;
      daily_budget?: number;
      lifetime_budget?: number;
      optimization_goal: string;
      billing_event: string;
      bid_amount?: number;
      start_time?: string;
      end_time?: string;
      targeting?: any;
      status?: string;
      promoted_object?: any;
      attribution_spec?: any;
      destination_type?: string;
      is_dynamic_creative?: boolean;
      use_new_app_click?: boolean;
      configured_status?: string;
      optimization_sub_event?: string;
      recurring_budget_semantics?: boolean;
    }
  ): Promise<{ id: string }> {
    // Get campaign to find account ID
    const campaign = await this.getCampaign(campaignId);
    const accountId = campaign.account_id;

    if (!accountId) {
      throw new Error("Unable to determine account ID from campaign");
    }

    const formattedAccountId = this.getFormattedAccountId(accountId);

    // Prepare request data
    const requestData = {
      ...adSetData,
      campaign_id: campaignId,
    };

    logger.debug("Creating ad set", { campaignId, accountId, requestData });

    try {
      const result = await this.postData<{ id: string }>(
        `${formattedAccountId}/adsets`,
        requestData,
        formattedAccountId
      );

      logger.debug("Ad set created successfully", { adSetId: result.id });
      return result;
    } catch (error) {
      logger.error("Ad set creation failed", error);
      throw error;
    }
  }

  // Ad Methods
  async getAds(
    params: PaginationParams & {
      adsetId?: string;
      campaignId?: string;
      accountId?: string;
      status?: string;
      fields?: string[];
    } = {}
  ): Promise<PaginatedResult<Ad>> {
    const { adsetId, campaignId, accountId, status, fields, ...paginationParams } = params;

    let endpoint: string;
    let rateLimitAccountId: string | undefined;

    if (adsetId) {
      endpoint = `${adsetId}/ads`;
    } else if (campaignId) {
      endpoint = `${campaignId}/ads`;
    } else if (accountId) {
      const formattedAccountId = this.getFormattedAccountId(accountId);
      endpoint = `${formattedAccountId}/ads`;
      rateLimitAccountId = formattedAccountId;
    } else {
      throw new Error("Either adsetId, campaignId, or accountId must be provided");
    }

    const queryParams: Record<string, any> = {
      fields:
        fields?.join(",") ||
        "id,name,adset_id,campaign_id,status,effective_status,created_time,updated_time,creative",
      ...paginationParams,
    };

    if (status) {
      queryParams.effective_status = JSON.stringify([status]);
    }

    const response = await this.getPaginatedData<Ad>(
      endpoint,
      queryParams,
      rateLimitAccountId
    );

    return PaginationHelper.parsePaginatedResponse(response);
  }

  async createAd(
    adSetId: string,
    adData: {
      name: string;
      adset_id: string;
      creative: { creative_id: string };
      status?: string;
    }
  ): Promise<Ad> {
    logger.debug("Creating ad", { adSetId, adData });

    try {
      const result = await this.postData<Ad>(`${adSetId}/ads`, adData);
      logger.debug("Ad created successfully", { adId: result.id });
      return result;
    } catch (error) {
      logger.error("Ad creation failed", error);
      throw error;
    }
  }
}