/**
 * Unified schema exports for all MCP tools
 * Provides backwards compatibility while maintaining clean organization
 */

// Campaign schemas
export * from './campaign-schemas.js';

// Analytics schemas  
export * from './analytics-schemas.js';

// Audience schemas
export * from './audience-schemas.js';

// Creative schemas
export * from './creative-schemas.js';

// OAuth and system schemas
import { z } from "zod";

export const GenerateAuthUrlSchema = z.object({
  scope: z
    .string()
    .default("ads_read,ads_management")
    .describe("OAuth scope permissions"),
  state: z
    .string()
    .optional()
    .describe("State parameter for OAuth security"),
});

export const ExchangeCodeForTokenSchema = z.object({
  code: z.string().describe("Authorization code from OAuth callback"),
  state: z.string().optional().describe("State parameter for verification"),
});

export const RefreshToLongLivedTokenSchema = z.object({
  short_lived_token: z.string().describe("Short-lived access token to exchange"),
});

export const GenerateSystemUserTokenSchema = z.object({
  business_id: z.string().describe("Business Manager ID"),
  system_user_id: z.string().describe("System user ID"),
  scope: z
    .string()
    .default("ads_read,ads_management")
    .describe("Token permissions scope"),
});

export const GetTokenInfoSchema = z.object({
  token: z.string().optional().describe("Token to inspect (uses current token if not provided)"),
});

export const ValidateTokenSchema = z.object({
  token: z.string().optional().describe("Token to validate (uses current token if not provided)"),
});

// System schemas
export const HealthCheckSchema = z.object({});

export const GetCapabilitiesSchema = z.object({});

export const GetAiGuidanceSchema = z.object({});

// Export OAuth input types
export type GenerateAuthUrlInput = z.infer<typeof GenerateAuthUrlSchema>;
export type ExchangeCodeForTokenInput = z.infer<typeof ExchangeCodeForTokenSchema>;
export type RefreshToLongLivedTokenInput = z.infer<typeof RefreshToLongLivedTokenSchema>;
export type GenerateSystemUserTokenInput = z.infer<typeof GenerateSystemUserTokenSchema>;
export type GetTokenInfoInput = z.infer<typeof GetTokenInfoSchema>;
export type ValidateTokenInput = z.infer<typeof ValidateTokenSchema>;