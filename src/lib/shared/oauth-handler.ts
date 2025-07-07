import { Request, Response } from 'express';
import { tokenManager, TokenData } from './token-manager';
import * as crypto from 'crypto';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
  successRedirect?: string;
  errorRedirect?: string;
}

export class FacebookOAuthHandler {
  private config: OAuthConfig;
  private stateStore: Map<string, { userId: string; timestamp: number }> = new Map();

  constructor(config: OAuthConfig) {
    this.config = config;
    
    // Clean up expired state entries every hour
    setInterval(() => this.cleanupExpiredStates(), 60 * 60 * 1000);
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(userId: string): string {
    const state = this.generateSecureState();
    
    // Store state temporarily (expires in 10 minutes)
    this.stateStore.set(state, {
      userId,
      timestamp: Date.now() + (10 * 60 * 1000)
    });

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope || 'ads_management,ads_read,business_management',
      state: state
    });

    return `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error, error_description } = req.query;

      // Handle OAuth errors
      if (error) {
        console.error('OAuth error:', error, error_description);
        return this.redirectWithError(res, error_description as string || 'OAuth authentication failed');
      }

      // Validate required parameters
      if (!code || !state) {
        return this.redirectWithError(res, 'Missing required OAuth parameters');
      }

      // Validate state parameter
      const stateData = this.stateStore.get(state as string);
      if (!stateData || stateData.timestamp < Date.now()) {
        return this.redirectWithError(res, 'Invalid or expired state parameter');
      }

      // Remove used state
      this.stateStore.delete(state as string);

      // Exchange code for access token
      const tokenData = await this.exchangeCodeForToken(code as string);
      
      // Store token for user
      await tokenManager.storeToken(stateData.userId, tokenData);

      // Redirect to success page
      const redirectUrl = this.config.successRedirect || '/dashboard';
      res.redirect(`${redirectUrl}?success=true`);

    } catch (error) {
      console.error('OAuth callback error:', error);
      return this.redirectWithError(res, 'Authentication failed');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<TokenData> {
    const tokenUrl = 'https://graph.facebook.com/v23.0/oauth/access_token';
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code: code
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error?.message || response.statusText}`);
    }

    const tokenData = await response.json();
    
    // Get user info for user_id
    const userInfo = await this.getUserInfo(tokenData.access_token);
    
    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      user_id: userInfo.id,
      created_at: Date.now()
    };
  }

  /**
   * Get user information from Facebook
   */
  private async getUserInfo(accessToken: string): Promise<any> {
    const userUrl = `https://graph.facebook.com/v23.0/me?access_token=${accessToken}&fields=id,name,email`;
    
    const response = await fetch(userUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<TokenData> {
    const tokenUrl = 'https://graph.facebook.com/v23.0/oauth/access_token';
    
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      fb_exchange_token: shortLivedToken
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Long-lived token exchange failed: ${errorData.error?.message || response.statusText}`);
    }

    const tokenData = await response.json();
    
    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in || 5184000, // 60 days default
      created_at: Date.now()
    };
  }

  /**
   * Debug access token
   */
  async debugToken(accessToken: string): Promise<any> {
    const debugUrl = `https://graph.facebook.com/v23.0/debug_token?input_token=${accessToken}&access_token=${this.config.clientId}|${this.config.clientSecret}`;
    
    const response = await fetch(debugUrl);
    
    if (!response.ok) {
      throw new Error(`Token debug failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    const revokeUrl = `https://graph.facebook.com/v23.0/me/permissions?access_token=${accessToken}`;
    
    const response = await fetch(revokeUrl, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Token revocation failed: ${response.statusText}`);
    }
  }

  /**
   * Generate secure state parameter
   */
  private generateSecureState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Redirect with error
   */
  private redirectWithError(res: Response, error: string): void {
    const redirectUrl = this.config.errorRedirect || '/login';
    const errorParam = encodeURIComponent(error);
    res.redirect(`${redirectUrl}?error=${errorParam}`);
  }

  /**
   * Clean up expired state entries
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.stateStore.entries()) {
      if (data.timestamp < now) {
        this.stateStore.delete(state);
      }
    }
  }
}

// Create OAuth handler instance
export const createOAuthHandler = (config: OAuthConfig): FacebookOAuthHandler => {
  return new FacebookOAuthHandler(config);
};