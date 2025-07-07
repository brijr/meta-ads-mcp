import express, { Request, Response } from 'express';
import cors from 'cors';
import { createOAuthHandler, OAuthConfig } from './oauth-handler';
import { tokenManager } from './token-manager';

export interface OAuthServerConfig {
  port?: number;
  corsOrigins?: string[];
  oauth: OAuthConfig;
}

export class OAuthServer {
  private app: express.Application;
  private oauthHandler: any;
  private config: OAuthServerConfig;

  constructor(config: OAuthServerConfig) {
    this.config = config;
    this.app = express();
    this.oauthHandler = createOAuthHandler(config.oauth);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigins || ['http://localhost:3000'],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // OAuth initiation endpoint
    this.app.get('/auth/facebook', (req: Request, res: Response) => {
      try {
        const userId = req.query.user_id as string;
        
        if (!userId) {
          return res.status(400).json({ error: 'user_id parameter is required' });
        }

        const authUrl = this.oauthHandler.generateAuthUrl(userId);
        res.redirect(authUrl);
      } catch (error) {
        console.error('OAuth initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate OAuth flow' });
      }
    });

    // OAuth callback endpoint
    this.app.get('/auth/facebook/callback', async (req: Request, res: Response) => {
      await this.oauthHandler.handleCallback(req, res);
    });

    // Get auth status endpoint
    this.app.get('/auth/status/:userId', async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const hasToken = await tokenManager.hasValidToken(userId);
        
        res.json({
          authenticated: hasToken,
          userId
        });
      } catch (error) {
        console.error('Auth status error:', error);
        res.status(500).json({ error: 'Failed to check auth status' });
      }
    });

    // Revoke token endpoint
    this.app.post('/auth/revoke/:userId', async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const tokenData = await tokenManager.getToken(userId);
        
        if (tokenData) {
          // Revoke token with Facebook
          await this.oauthHandler.revokeToken(tokenData.access_token);
          // Remove from local storage
          await tokenManager.removeToken(userId);
        }
        
        res.json({ success: true });
      } catch (error) {
        console.error('Token revocation error:', error);
        res.status(500).json({ error: 'Failed to revoke token' });
      }
    });

    // Debug token endpoint (for development)
    this.app.get('/auth/debug/:userId', async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const tokenData = await tokenManager.getToken(userId);
        
        if (!tokenData) {
          return res.status(404).json({ error: 'No token found for user' });
        }

        const debugInfo = await this.oauthHandler.debugToken(tokenData.access_token);
        res.json(debugInfo);
      } catch (error) {
        console.error('Token debug error:', error);
        res.status(500).json({ error: 'Failed to debug token' });
      }
    });

    // Error handling middleware
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public start(): void {
    const port = this.config.port || 3003;
    this.app.listen(port, () => {
      console.log(`OAuth server running on port ${port}`);
      console.log(`OAuth initiation: http://localhost:${port}/auth/facebook?user_id=USER_ID`);
      console.log(`OAuth callback: http://localhost:${port}/auth/facebook/callback`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Helper function to create and start OAuth server
export const createOAuthServer = (config: OAuthServerConfig): OAuthServer => {
  return new OAuthServer(config);
};