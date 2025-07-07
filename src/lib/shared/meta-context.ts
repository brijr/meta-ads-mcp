import { FacebookAdsApi, AdAccount, Campaign, AdSet, Ad, AdCreative, AdImage, CustomAudience } from 'facebook-nodejs-business-sdk';

export interface MetaApiClient {
  getAdAccounts(): Promise<AdAccount[]>;
  getCampaigns(accountId: string, options?: any): Promise<{ data: Campaign[] }>;
  getAdSets(accountId: string, options?: any): Promise<{ data: AdSet[] }>;
  getAds(accountId: string, options?: any): Promise<{ data: Ad[] }>;
  getInsights(accountId: string, options?: any): Promise<any>;
  createCampaign(accountId: string, data: any): Promise<Campaign>;
  updateCampaign(campaignId: string, data: any): Promise<Campaign>;
  pauseCampaign(campaignId: string): Promise<Campaign>;
  resumeCampaign(campaignId: string): Promise<Campaign>;
  getAdCreatives(accountId: string, options?: any): Promise<{ data: AdCreative[] }>;
  getAudiences(accountId: string, options?: any): Promise<{ data: CustomAudience[] }>;
}

class MetaApiClientImpl implements MetaApiClient {
  private api: FacebookAdsApi;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.api = FacebookAdsApi.init(accessToken);
  }

  async getAdAccounts(): Promise<AdAccount[]> {
    try {
      const accounts = await new AdAccount().getAdAccounts([
        'id',
        'name',
        'account_status',
        'currency',
        'timezone_name',
        'account_id'
      ]);
      return accounts;
    } catch (error) {
      throw new Error(`Failed to get ad accounts: ${error.message}`);
    }
  }

  async getCampaigns(accountId: string, options: any = {}): Promise<{ data: Campaign[] }> {
    try {
      const account = new AdAccount(accountId);
      const campaigns = await account.getCampaigns(
        options.fields || [
          'id',
          'name',
          'status',
          'effective_status',
          'objective',
          'daily_budget',
          'lifetime_budget',
          'created_time',
          'updated_time'
        ],
        options
      );
      return { data: campaigns };
    } catch (error) {
      throw new Error(`Failed to get campaigns: ${error.message}`);
    }
  }

  async getAdSets(accountId: string, options: any = {}): Promise<{ data: AdSet[] }> {
    try {
      const account = new AdAccount(accountId);
      const adSets = await account.getAdSets(
        options.fields || [
          'id',
          'name',
          'status',
          'effective_status',
          'daily_budget',
          'lifetime_budget',
          'created_time',
          'updated_time'
        ],
        options
      );
      return { data: adSets };
    } catch (error) {
      throw new Error(`Failed to get ad sets: ${error.message}`);
    }
  }

  async getAds(accountId: string, options: any = {}): Promise<{ data: Ad[] }> {
    try {
      const account = new AdAccount(accountId);
      const ads = await account.getAds(
        options.fields || [
          'id',
          'name',
          'status',
          'effective_status',
          'created_time',
          'updated_time'
        ],
        options
      );
      return { data: ads };
    } catch (error) {
      throw new Error(`Failed to get ads: ${error.message}`);
    }
  }

  async getInsights(accountId: string, options: any = {}): Promise<any> {
    try {
      const account = new AdAccount(accountId);
      const insights = await account.getInsights(
        options.fields || [
          'impressions',
          'clicks',
          'spend',
          'ctr',
          'cpc',
          'cpm',
          'cpp',
          'date_start',
          'date_stop'
        ],
        options
      );
      return insights;
    } catch (error) {
      throw new Error(`Failed to get insights: ${error.message}`);
    }
  }

  async createCampaign(accountId: string, data: any): Promise<Campaign> {
    try {
      const account = new AdAccount(accountId);
      const campaign = await account.createCampaign([], data);
      return campaign;
    } catch (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  async updateCampaign(campaignId: string, data: any): Promise<Campaign> {
    try {
      const campaign = new Campaign(campaignId);
      await campaign.update([], data);
      return campaign;
    } catch (error) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
  }

  async pauseCampaign(campaignId: string): Promise<Campaign> {
    try {
      const campaign = new Campaign(campaignId);
      await campaign.update([], { status: 'PAUSED' });
      return campaign;
    } catch (error) {
      throw new Error(`Failed to pause campaign: ${error.message}`);
    }
  }

  async resumeCampaign(campaignId: string): Promise<Campaign> {
    try {
      const campaign = new Campaign(campaignId);
      await campaign.update([], { status: 'ACTIVE' });
      return campaign;
    } catch (error) {
      throw new Error(`Failed to resume campaign: ${error.message}`);
    }
  }

  async getAdCreatives(accountId: string, options: any = {}): Promise<{ data: AdCreative[] }> {
    try {
      const account = new AdAccount(accountId);
      const creatives = await account.getAdCreatives(
        options.fields || [
          'id',
          'name',
          'status',
          'object_story_spec',
          'image_hash',
          'image_url',
          'thumbnail_url'
        ],
        options
      );
      return { data: creatives };
    } catch (error) {
      throw new Error(`Failed to get ad creatives: ${error.message}`);
    }
  }

  async getAudiences(accountId: string, options: any = {}): Promise<{ data: CustomAudience[] }> {
    try {
      const account = new AdAccount(accountId);
      const audiences = await account.getCustomAudiences(
        options.fields || [
          'id',
          'name',
          'description',
          'approximate_count',
          'data_source',
          'delivery_status',
          'operation_status'
        ],
        options
      );
      return { data: audiences };
    } catch (error) {
      throw new Error(`Failed to get audiences: ${error.message}`);
    }
  }
}

export class MetaContext {
  static async withClient<T>(
    headers: Record<string, string>,
    callback: (client: MetaApiClient) => Promise<T>
  ): Promise<T> {
    const accessToken = this.extractAccessToken(headers);
    
    if (!accessToken) {
      throw new Error('No access token provided in headers');
    }

    const client = new MetaApiClientImpl(accessToken);
    return await callback(client);
  }

  private static extractAccessToken(headers: Record<string, string>): string | null {
    // Try different header formats
    const authHeader = headers['authorization'] || headers['Authorization'];
    
    if (authHeader) {
      // Handle "Bearer token" format
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      if (bearerMatch) {
        return bearerMatch[1];
      }
      
      // Handle direct token
      return authHeader;
    }

    // Try x-access-token header
    const accessTokenHeader = headers['x-access-token'] || headers['X-Access-Token'];
    if (accessTokenHeader) {
      return accessTokenHeader;
    }

    return null;
  }
}