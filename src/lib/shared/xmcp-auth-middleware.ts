import { z } from 'zod';

export interface AuthContext {
  userId?: string;
  accessToken?: string;
  headers: Record<string, string>;
}

export interface AuthResult {
  isValid: boolean;
  userId?: string;
  accessToken?: string;
  error?: string;
}

export class XMCPAuthMiddleware {
  /**
   * Validates the access token from the request headers
   * @param headers - Request headers containing authorization
   * @returns Promise<AuthResult>
   */
  static async validateAccessToken(headers: Record<string, string>): Promise<AuthResult> {
    try {
      const accessToken = this.extractAccessToken(headers);
      
      if (!accessToken) {
        return {
          isValid: false,
          error: 'No access token provided'
        };
      }

      // Basic token validation - in a real implementation, you might want to:
      // 1. Validate token format
      // 2. Check token expiration
      // 3. Verify token with Facebook's debug endpoint
      // 4. Check token permissions/scopes
      
      if (!this.isValidTokenFormat(accessToken)) {
        return {
          isValid: false,
          error: 'Invalid access token format'
        };
      }

      return {
        isValid: true,
        accessToken,
        userId: this.extractUserIdFromToken(accessToken)
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Authentication failed: ${error.message}`
      };
    }
  }

  /**
   * Creates an authenticated context for tool execution
   * @param headers - Request headers
   * @returns Promise<AuthContext>
   */
  static async createAuthContext(headers: Record<string, string>): Promise<AuthContext> {
    const authResult = await this.validateAccessToken(headers);
    
    return {
      userId: authResult.userId,
      accessToken: authResult.accessToken,
      headers
    };
  }

  /**
   * Middleware function to check if request is authenticated
   * @param headers - Request headers
   * @returns Promise<boolean>
   */
  static async isAuthenticated(headers: Record<string, string>): Promise<boolean> {
    const authResult = await this.validateAccessToken(headers);
    return authResult.isValid;
  }

  /**
   * Extracts access token from various header formats
   * @param headers - Request headers
   * @returns string | null
   */
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

    // Try x-meta-access-token header (custom for Meta API)
    const metaTokenHeader = headers['x-meta-access-token'] || headers['X-Meta-Access-Token'];
    if (metaTokenHeader) {
      return metaTokenHeader;
    }

    return null;
  }

  /**
   * Basic validation of token format
   * @param token - Access token to validate
   * @returns boolean
   */
  private static isValidTokenFormat(token: string): boolean {
    // Basic checks for Facebook access token format
    // Facebook tokens are typically:
    // - App access tokens: {app-id}|{app-secret}
    // - User access tokens: EAA... (base64-like format)
    // - Page access tokens: EAA... (base64-like format)
    
    if (!token || token.length < 10) {
      return false;
    }

    // Check for common Facebook token patterns
    const fbTokenPatterns = [
      /^EAA/, // User/Page access tokens typically start with EAA
      /^\d+\|/, // App access tokens start with app-id|
      /^[A-Za-z0-9_-]+$/ // General alphanumeric with hyphens/underscores
    ];

    return fbTokenPatterns.some(pattern => pattern.test(token));
  }

  /**
   * Extracts user ID from token (if possible)
   * Note: This is a simplified implementation
   * In production, you'd use Facebook's debug endpoint
   * @param token - Access token
   * @returns string | undefined
   */
  private static extractUserIdFromToken(token: string): string | undefined {
    // For now, we'll generate a simple hash-based ID
    // In a real implementation, you'd:
    // 1. Call Facebook's debug endpoint: /debug_token?input_token={token}
    // 2. Extract user_id from the response
    
    // Simple hash-based user ID for demo purposes
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `user_${Math.abs(hash)}`;
  }
}

/**
 * Zod schema for validating auth headers
 */
export const AuthHeadersSchema = z.object({
  authorization: z.string().optional(),
  Authorization: z.string().optional(),
  'x-access-token': z.string().optional(),
  'X-Access-Token': z.string().optional(),
  'x-meta-access-token': z.string().optional(),
  'X-Meta-Access-Token': z.string().optional(),
}).passthrough(); // Allow other headers

/**
 * Type for validated auth headers
 */
export type AuthHeaders = z.infer<typeof AuthHeadersSchema>;

/**
 * Helper function to validate and extract auth information from context
 * @param context - XMCP tool context
 * @returns Promise<AuthResult>
 */
export async function extractAuthFromContext(context: any): Promise<AuthResult> {
  const headers = context?.headers || {};
  return await XMCPAuthMiddleware.validateAccessToken(headers);
}