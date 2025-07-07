import dotenv from 'dotenv';
import { createOAuthServer } from './lib/shared/oauth-server';

// Load environment variables
dotenv.config();

// OAuth server configuration
const oauthConfig = {
  port: parseInt(process.env.OAUTH_SERVER_PORT || '3003'),
  corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  oauth: {
    clientId: process.env.META_APP_ID || '',
    clientSecret: process.env.META_APP_SECRET || '',
    redirectUri: process.env.META_REDIRECT_URI || 'http://localhost:3003/auth/facebook/callback',
    scope: 'ads_management,ads_read,business_management,pages_read_engagement,pages_manage_posts',
    successRedirect: process.env.OAUTH_SUCCESS_REDIRECT || 'http://localhost:3000/dashboard',
    errorRedirect: process.env.OAUTH_ERROR_REDIRECT || 'http://localhost:3000/login?error=auth_failed'
  }
};

// Validate required environment variables
if (!oauthConfig.oauth.clientId || !oauthConfig.oauth.clientSecret) {
  console.error('Missing required environment variables: META_APP_ID, META_APP_SECRET');
  process.exit(1);
}

// Create and start OAuth server
const server = createOAuthServer(oauthConfig);
server.start();

console.log('OAuth server started with configuration:');
console.log(`- Port: ${oauthConfig.port}`);
console.log(`- Redirect URI: ${oauthConfig.oauth.redirectUri}`);
console.log(`- CORS Origins: ${oauthConfig.corsOrigins.join(', ')}`);
console.log('\nTo initiate OAuth flow, visit:');
console.log(`http://localhost:${oauthConfig.port}/auth/facebook?user_id=YOUR_USER_ID`);