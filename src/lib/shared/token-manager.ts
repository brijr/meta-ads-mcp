import * as crypto from 'crypto';

export interface TokenData {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  expires_at?: number;
  user_id?: string;
  created_at: number;
}

export interface TokenStorage {
  store(userId: string, tokenData: TokenData): Promise<void>;
  retrieve(userId: string): Promise<TokenData | null>;
  remove(userId: string): Promise<void>;
  isValid(userId: string): Promise<boolean>;
}

/**
 * In-memory token storage - for development only
 * In production, use Redis or secure database storage
 */
export class MemoryTokenStorage implements TokenStorage {
  private tokens: Map<string, TokenData> = new Map();

  async store(userId: string, tokenData: TokenData): Promise<void> {
    this.tokens.set(userId, {
      ...tokenData,
      created_at: Date.now()
    });
  }

  async retrieve(userId: string): Promise<TokenData | null> {
    return this.tokens.get(userId) || null;
  }

  async remove(userId: string): Promise<void> {
    this.tokens.delete(userId);
  }

  async isValid(userId: string): Promise<boolean> {
    const tokenData = await this.retrieve(userId);
    if (!tokenData) return false;

    // Check if token is expired
    if (tokenData.expires_at && tokenData.expires_at < Date.now()) {
      await this.remove(userId);
      return false;
    }

    return true;
  }
}

/**
 * Redis token storage - for production use
 * Uncomment and configure Redis connection for production
 */
// export class RedisTokenStorage implements TokenStorage {
//   private redis: any; // Redis client
//   private keyPrefix = 'meta_token:';
//   private defaultExpiry = 7200; // 2 hours in seconds

//   constructor(redisClient: any) {
//     this.redis = redisClient;
//   }

//   async store(userId: string, tokenData: TokenData): Promise<void> {
//     const key = `${this.keyPrefix}${userId}`;
//     const data = JSON.stringify({
//       ...tokenData,
//       created_at: Date.now()
//     });
    
//     const expiry = tokenData.expires_in || this.defaultExpiry;
//     await this.redis.setex(key, expiry, data);
//   }

//   async retrieve(userId: string): Promise<TokenData | null> {
//     const key = `${this.keyPrefix}${userId}`;
//     const data = await this.redis.get(key);
//     return data ? JSON.parse(data) : null;
//   }

//   async remove(userId: string): Promise<void> {
//     const key = `${this.keyPrefix}${userId}`;
//     await this.redis.del(key);
//   }

//   async isValid(userId: string): Promise<boolean> {
//     const key = `${this.keyPrefix}${userId}`;
//     const exists = await this.redis.exists(key);
//     return exists === 1;
//   }
// }

export class TokenManager {
  private storage: TokenStorage;
  private encryptionKey: string;

  constructor(storage: TokenStorage, encryptionKey?: string) {
    this.storage = storage;
    this.encryptionKey = encryptionKey || process.env.TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  /**
   * Store an access token for a user
   */
  async storeToken(userId: string, tokenData: TokenData): Promise<void> {
    // Calculate expiration time if provided
    if (tokenData.expires_in) {
      tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
    }

    // Encrypt sensitive data
    const encryptedData = {
      ...tokenData,
      access_token: this.encrypt(tokenData.access_token),
      refresh_token: tokenData.refresh_token ? this.encrypt(tokenData.refresh_token) : undefined
    };

    await this.storage.store(userId, encryptedData);
  }

  /**
   * Retrieve an access token for a user
   */
  async getToken(userId: string): Promise<TokenData | null> {
    const tokenData = await this.storage.retrieve(userId);
    if (!tokenData) return null;

    // Decrypt sensitive data
    const decryptedData = {
      ...tokenData,
      access_token: this.decrypt(tokenData.access_token),
      refresh_token: tokenData.refresh_token ? this.decrypt(tokenData.refresh_token) : undefined
    };

    return decryptedData;
  }

  /**
   * Remove a user's token
   */
  async removeToken(userId: string): Promise<void> {
    await this.storage.remove(userId);
  }

  /**
   * Check if a user has a valid token
   */
  async hasValidToken(userId: string): Promise<boolean> {
    return await this.storage.isValid(userId);
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(userId: string): Promise<string | null> {
    const tokenData = await this.getToken(userId);
    return tokenData?.access_token || null;
  }

  /**
   * Refresh an access token (if refresh token is available)
   * Note: Facebook tokens typically cannot be refreshed automatically
   */
  async refreshToken(userId: string): Promise<TokenData | null> {
    const tokenData = await this.getToken(userId);
    if (!tokenData?.refresh_token) {
      return null;
    }

    // TODO: Implement refresh token logic
    // Facebook's long-lived tokens cannot be automatically refreshed
    // User would need to re-authenticate after 60 days
    
    return tokenData;
  }

  /**
   * Generate a secure state parameter for OAuth flow
   */
  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate state parameter
   */
  validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState;
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Default token manager instance
export const tokenManager = new TokenManager(new MemoryTokenStorage());