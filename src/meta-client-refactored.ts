/**
 * Refactored Meta API Client - Simplified aggregator of focused services
 * This replaces the 913-line god class with a clean composition pattern
 */

import { AuthManager } from "./utils/auth.js";
import { CampaignService } from "./services/campaign-service.js";
import { AnalyticsService } from "./services/analytics-service.js";
import { AudienceService } from "./services/audience-service.js";
import { CreativeService } from "./services/creative-service.js";
import { BaseApiClient } from "./services/base-api-client.js";
import { logger } from "./utils/logger.js";
import type { AdAccount, MetaApiResponse } from "./types/meta-api.js";

export class MetaApiClient extends BaseApiClient {
  // Composed services for different domains
  public readonly campaigns: CampaignService;
  public readonly analytics: AnalyticsService;
  public readonly audiences: AudienceService;
  public readonly creatives: CreativeService;

  constructor(auth?: AuthManager) {
    super(auth);
    
    // Initialize all services with shared auth
    this.campaigns = new CampaignService(this.auth);
    this.analytics = new AnalyticsService(this.auth);
    this.audiences = new AudienceService(this.auth);
    this.creatives = new CreativeService(this.auth);

    logger.debug("MetaApiClient initialized with all services");
  }

  // Legacy compatibility methods - delegate to appropriate services
  async getAdAccounts(): Promise<AdAccount[]> {
    const response = await this.makeRequest<MetaApiResponse<AdAccount>>(
      "me/adaccounts?fields=id,name,account_status,balance,currency,timezone_name,business"
    );
    return response.data;
  }

  async getAdAccount(accountId: string): Promise<AdAccount> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    const fields = "id,name,account_status,currency,timezone_name,funding_source_details,business";
    
    return this.makeRequest<AdAccount>(
      `${formattedAccountId}?fields=${fields}`,
      "GET",
      undefined,
      formattedAccountId
    );
  }

  // Campaign methods - delegate to campaign service
  async getCampaigns(accountId: string, params: any = {}) {
    return this.campaigns.getCampaigns(accountId, params);
  }

  async getCampaign(campaignId: string) {
    return this.campaigns.getCampaign(campaignId);
  }

  async createCampaign(accountId: string, campaignData: any) {
    return this.campaigns.createCampaign(accountId, campaignData);
  }

  async updateCampaign(campaignId: string, updates: any) {
    return this.campaigns.updateCampaign(campaignId, updates);
  }

  async deleteCampaign(campaignId: string) {
    return this.campaigns.deleteCampaign(campaignId);
  }

  // Ad Set methods - delegate to campaign service
  async getAdSets(params: any = {}) {
    return this.campaigns.getAdSets(params);
  }

  async createAdSet(campaignId: string, adSetData: any) {
    return this.campaigns.createAdSet(campaignId, adSetData);
  }

  // Ad methods - delegate to campaign service
  async getAds(params: any = {}) {
    return this.campaigns.getAds(params);
  }

  async createAd(adSetId: string, adData: any) {
    return this.campaigns.createAd(adSetId, adData);
  }

  // Analytics methods - delegate to analytics service
  async getInsights(objectId: string, params: any = {}) {
    return this.analytics.getInsights(objectId, params);
  }

  // Audience methods - delegate to audience service
  async getCustomAudiences(accountId: string, params: any = {}) {
    return this.audiences.getCustomAudiences(accountId, params);
  }

  async createCustomAudience(accountId: string, audienceData: any) {
    return this.audiences.createCustomAudience(accountId, audienceData);
  }

  async createLookalikeAudience(accountId: string, audienceData: any) {
    return this.audiences.createLookalikeAudience(accountId, audienceData);
  }

  async estimateAudienceSize(accountId: string, targeting: any, optimizationGoal: string) {
    return this.audiences.estimateAudienceSize(accountId, targeting, optimizationGoal);
  }

  // Creative methods - delegate to creative service
  async getAdCreatives(accountId: string, params: any = {}) {
    return this.creatives.getAdCreatives(accountId, params);
  }

  async createAdCreative(accountId: string, creativeData: any) {
    return this.creatives.createAdCreative(accountId, creativeData);
  }

  async generateAdPreview(creativeId: string, adFormat: string, productItemIds?: string[]) {
    return this.creatives.generateAdPreview(creativeId, adFormat, productItemIds);
  }

  async uploadImageFromUrl(accountId: string, imageUrl: string, imageName?: string) {
    return this.creatives.uploadImageFromUrl(accountId, imageUrl, imageName);
  }

  // Additional compatibility methods
  async getAdsByCampaign(campaignId: string, params: any = {}) {
    return this.campaigns.getAds({ campaignId, ...params });
  }

  async getAdsByAccount(accountId: string, params: any = {}) {
    return this.campaigns.getAds({ accountId, ...params });
  }

  async getCustomAudience(audienceId: string) {
    return this.audiences.getCustomAudience 
      ? this.audiences.getCustomAudience(audienceId)
      : this.makeRequest(`${audienceId}?fields=id,name,description,approximate_count,delivery_status,operation_status`);
  }

  extractAccountIdFromObjectId(objectId: string): string | undefined {
    // Try to extract account ID from campaign/adset/ad ID patterns
    const campaign = objectId.match(/^(\d+)$/);
    if (campaign) {
      return undefined;
    }

    // If it's already a formatted account ID
    if (objectId.startsWith("act_")) {
      return objectId;
    }

    return undefined;
  }

  // Utility methods for backwards compatibility
  async getFundingSources(accountId: string): Promise<any[]> {
    const formattedAccountId = this.getFormattedAccountId(accountId);

    try {
      const result = await this.makeRequest<MetaApiResponse<any>>(
        `${formattedAccountId}/funding_source_details`,
        "GET",
        undefined,
        formattedAccountId
      );
      return result.data || [];
    } catch (error) {
      return [];
    }
  }

  async getAccountBusiness(accountId: string): Promise<any> {
    const formattedAccountId = this.getFormattedAccountId(accountId);

    try {
      return await this.makeRequest<any>(
        `${formattedAccountId}/business`,
        "GET",
        undefined,
        formattedAccountId
      );
    } catch (error) {
      return {};
    }
  }

  // Batch operations (kept for compatibility)
  async batchRequest(requests: any[]): Promise<any[]> {
    const body = this.buildQueryString({
      batch: JSON.stringify(requests),
    });

    return this.makeRequest<any[]>("", "POST", body, undefined, true);
  }

  // Service access for advanced users
  getCampaignService(): CampaignService {
    return this.campaigns;
  }

  getAnalyticsService(): AnalyticsService {
    return this.analytics;
  }

  getAudienceService(): AudienceService {
    return this.audiences;
  }

  getCreativeService(): CreativeService {
    return this.creatives;
  }
}