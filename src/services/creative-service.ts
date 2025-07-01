/**
 * Creative Service - Focused service for ad creative and asset operations
 * Extracted from MetaApiClient for better separation of concerns
 */

import { BaseApiClient } from "./base-api-client.js";
import { PaginationHelper, type PaginationParams, type PaginatedResult } from "../utils/pagination.js";
import { logger } from "../utils/logger.js";
import type { AdCreative } from "../types/meta-api.js";

export class CreativeService extends BaseApiClient {

  async getAdCreatives(
    accountId: string,
    params: PaginationParams & { fields?: string[] } = {}
  ): Promise<PaginatedResult<AdCreative>> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    const { fields, ...paginationParams } = params;

    const queryParams: Record<string, any> = {
      fields:
        fields?.join(",") ||
        "id,name,title,body,image_url,video_id,call_to_action,object_story_spec",
      ...paginationParams,
    };

    const response = await this.getPaginatedData<AdCreative>(
      `${formattedAccountId}/adcreatives`,
      queryParams,
      formattedAccountId
    );

    return PaginationHelper.parsePaginatedResponse(response);
  }

  async getAdCreative(creativeId: string): Promise<AdCreative> {
    const fields = "id,name,title,body,image_url,video_id,call_to_action,object_story_spec,thumbnail_url";
    
    return this.makeRequest<AdCreative>(`${creativeId}?fields=${fields}`);
  }

  async createAdCreative(
    accountId: string,
    creativeData: {
      name: string;
      object_story_spec: any;
      degrees_of_freedom_spec?: any;
    }
  ): Promise<AdCreative> {
    const formattedAccountId = this.getFormattedAccountId(accountId);
    
    return this.postData<AdCreative>(
      `${formattedAccountId}/adcreatives`,
      creativeData,
      formattedAccountId
    );
  }

  async updateAdCreative(
    creativeId: string,
    updates: {
      name?: string;
      object_story_spec?: any;
    }
  ): Promise<{ success: boolean }> {
    return this.postData<{ success: boolean }>(creativeId, updates);
  }

  async deleteAdCreative(creativeId: string): Promise<{ success: boolean }> {
    return this.deleteResource<{ success: boolean }>(creativeId);
  }

  async generateAdPreview(
    creativeId: string,
    adFormat: string,
    productItemIds?: string[]
  ): Promise<{ body: string }> {
    const queryParams: Record<string, any> = {
      ad_format: adFormat,
    };

    if (productItemIds && productItemIds.length > 0) {
      queryParams.product_item_ids = productItemIds;
    }

    return this.getPaginatedData<{ body: string }>(
      `${creativeId}/previews`,
      queryParams
    ) as any;
  }

  async uploadImageFromUrl(
    accountId: string,
    imageUrl: string,
    imageName?: string
  ): Promise<{ hash: string; url: string; name: string }> {
    try {
      const formattedAccountId = this.getFormattedAccountId(accountId);

      logger.debug("Uploading image from URL", { accountId: formattedAccountId, imageUrl, imageName });

      // Download the image from the URL
      const imageResponse = await fetch(imageUrl);

      if (!imageResponse.ok) {
        throw new Error(
          `Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`
        );
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBlob = new Blob([imageBuffer], {
        type: imageResponse.headers.get("content-type") || "image/jpeg",
      });

      logger.debug("Image downloaded", { 
        size: imageBuffer.byteLength, 
        contentType: imageResponse.headers.get("content-type") 
      });

      // Generate filename if not provided
      const filename = imageName || `uploaded_image_${Date.now()}.jpg`;

      // Create FormData for upload
      const formData = new FormData();
      formData.append("filename", imageBlob, filename);
      formData.append("access_token", this.auth.getAccessToken());

      // Upload to Meta API
      const uploadResponse = await fetch(
        `https://graph.facebook.com/v23.0/${formattedAccountId}/adimages`,
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadResult = (await uploadResponse.json()) as any;
      logger.debug("Upload response received", uploadResult);

      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed: ${JSON.stringify(uploadResult)}`);
      }

      // Extract image hash from response
      const images = uploadResult.images;
      if (!images || Object.keys(images).length === 0) {
        throw new Error("No image hash returned from Meta API");
      }

      // Get the first (and usually only) image result
      const imageKey = Object.keys(images)[0];
      const imageResult = images[imageKey];

      if (!imageResult.hash) {
        throw new Error("No hash found in image upload response");
      }

      logger.debug("Image uploaded successfully", {
        hash: imageResult.hash,
        url: imageResult.url
      });

      return {
        hash: imageResult.hash,
        url: imageResult.url || imageUrl,
        name: filename,
      };
    } catch (error) {
      logger.error("Image upload failed", error);
      throw error;
    }
  }

  async uploadImageFile(
    accountId: string,
    imageFile: any, // Accept any type since we're working with different file types
    filename: string
  ): Promise<{ hash: string; url: string; name: string }> {
    const formattedAccountId = this.getFormattedAccountId(accountId);

    const formData = new FormData();
    formData.append("filename", imageFile, filename);
    formData.append("access_token", this.auth.getAccessToken());

    try {
      const uploadResponse = await fetch(
        `https://graph.facebook.com/v23.0/${formattedAccountId}/adimages`,
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadResult = (await uploadResponse.json()) as any;

      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed: ${JSON.stringify(uploadResult)}`);
      }

      const images = uploadResult.images;
      const imageKey = Object.keys(images)[0];
      const imageResult = images[imageKey];

      return {
        hash: imageResult.hash,
        url: imageResult.url,
        name: filename,
      };
    } catch (error) {
      logger.error("Image file upload failed", error);
      throw error;
    }
  }

  async validateCreativeSetup(
    accountId: string,
    creativeSpec: any
  ): Promise<{
    is_valid: boolean;
    issues?: string[];
    warnings?: string[];
  }> {
    try {
      // Try to create a preview to validate the creative
      const testCreative = await this.createAdCreative(accountId, {
        name: `validation_test_${Date.now()}`,
        object_story_spec: creativeSpec,
      });

      // If creation succeeds, clean up the test creative
      await this.deleteAdCreative(testCreative.id);

      return { is_valid: true };
    } catch (error) {
      return {
        is_valid: false,
        issues: [error instanceof Error ? error.message : "Creative validation failed"],
      };
    }
  }

  async getCreativeInsights(
    creativeId: string,
    params: {
      date_preset?: string;
      time_range?: { since: string; until: string };
      fields?: string[];
    } = {}
  ): Promise<any> {
    const queryParams = {
      fields: params.fields?.join(",") || "impressions,clicks,ctr,cpc,spend,reach",
      ...params,
    };

    return this.getPaginatedData(
      `${creativeId}/insights`,
      queryParams
    );
  }

  async getBestPractices(
    adFormat: string,
    _objective?: string
  ): Promise<{
    format: string;
    recommendations: string[];
    specifications: any;
  }> {
    // This would typically come from Meta's API, but for now we'll return static best practices
    const bestPractices = {
      single_image: {
        recommendations: [
          "Use high-quality images with 1200x628 pixels minimum",
          "Keep text overlay under 20% of image area",
          "Use bright, eye-catching colors",
          "Ensure image is relevant to your target audience",
        ],
        specifications: {
          min_width: 600,
          min_height: 600,
          max_ratio: "1.91:1",
          recommended_ratio: "1:1 or 4:5",
          file_formats: ["JPG", "PNG"],
          max_file_size: "30MB",
        },
      },
      video: {
        recommendations: [
          "Keep videos under 15 seconds for best performance",
          "Design for sound-off viewing with captions",
          "Use strong opening to capture attention immediately",
          "Include your brand early in the video",
        ],
        specifications: {
          min_resolution: "720p",
          aspect_ratios: ["1:1", "4:5", "9:16"],
          max_duration: "240 seconds",
          file_formats: ["MP4", "MOV"],
          max_file_size: "4GB",
        },
      },
    };

    return {
      format: adFormat,
      ...(bestPractices[adFormat as keyof typeof bestPractices] || bestPractices.single_image),
    };
  }
}