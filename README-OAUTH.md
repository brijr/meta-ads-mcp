# Meta MCP Server OAuth Authentication Setup

This document explains how to set up OAuth authentication for the Meta MCP server to manage Facebook ads on behalf of users.

## Overview

The Meta MCP server now supports OAuth2 authentication with Facebook, allowing your application to:
- Authenticate users with their Facebook accounts
- Manage Facebook ads campaigns on their behalf
- Securely store and manage access tokens
- Provide authenticated access to Meta Marketing API tools

## Prerequisites

1. **Facebook Developer Account**: Create an account at [developers.facebook.com](https://developers.facebook.com)
2. **Facebook App**: Create a new Facebook app with the following permissions:
   - `ads_management` - Create and manage ads
   - `ads_read` - Read ad account data
   - `business_management` - Access business account data
   - `pages_read_engagement` - Read page engagement data
   - `pages_manage_posts` - Manage page posts

## Environment Setup

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables**:
   ```bash
   # Meta/Facebook API Configuration
   META_APP_ID=your_facebook_app_id
   META_APP_SECRET=your_facebook_app_secret
   META_REDIRECT_URI=http://localhost:3003/auth/facebook/callback
   
   # OAuth Configuration
   OAUTH_CALLBACK_URL=http://localhost:3003/auth/facebook/callback
   OAUTH_SUCCESS_REDIRECT=http://localhost:3000/dashboard
   OAUTH_ERROR_REDIRECT=http://localhost:3000/login?error=auth_failed
   
   # Token Storage
   TOKEN_STORAGE_TYPE=memory
   TOKEN_ENCRYPTION_KEY=your-secret-encryption-key-min-32-chars
   
   # Server Configuration
   XMCP_HTTP_PORT=3002
   OAUTH_SERVER_PORT=3003
   XMCP_CORS_ORIGIN=http://localhost:3000
   
   # Security
   ENABLE_APP_SECRET_PROOF=true
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3003
   ```

## Facebook App Configuration

1. **Go to Facebook Developers Console**:
   - Visit [developers.facebook.com](https://developers.facebook.com)
   - Navigate to your app settings

2. **Configure OAuth Settings**:
   - Go to **Products** > **Facebook Login** > **Settings**
   - Add your redirect URI: `http://localhost:3003/auth/facebook/callback`
   - For production, use your domain: `https://yourdomain.com/auth/facebook/callback`

3. **Add Required Permissions**:
   - Go to **App Review** > **Permissions and Features**
   - Request the following permissions:
     - `ads_management`
     - `ads_read`
     - `business_management`
     - `pages_read_engagement`
     - `pages_manage_posts`

## Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Build the project**:
   ```bash
   pnpm build
   ```

## Running the Servers

The Meta MCP server now consists of two components:

### 1. XMCP Server (Main MCP Server)
```bash
# Development
pnpm dev

# Production
pnpm start-http
```
- Runs on port 3002 (configurable via `XMCP_HTTP_PORT`)
- Provides the MCP tools for Meta API operations
- Requires authenticated requests with access tokens

### 2. OAuth Server (Authentication Server)
```bash
# Development
pnpm dev-oauth

# Production
pnpm start-oauth
```
- Runs on port 3003 (configurable via `OAUTH_SERVER_PORT`)
- Handles OAuth flow and token management
- Provides endpoints for authentication

## OAuth Flow

### 1. Initiate OAuth Flow
Direct users to the OAuth initiation endpoint:
```
http://localhost:3003/auth/facebook?user_id=USER_ID
```

### 2. User Authorization
- User will be redirected to Facebook for login
- They'll be asked to authorize your app
- Facebook redirects back to your callback URL

### 3. Token Exchange
- The OAuth server automatically exchanges the authorization code for an access token
- Long-lived tokens are obtained when possible
- Tokens are securely stored and encrypted

### 4. Use MCP Tools
Once authenticated, users can use the MCP tools by including their access token in headers:

```javascript
// Example: Using the MCP client
const response = await mcpClient.callTool('get_campaigns', {
  account_id: 'act_123456789'
}, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## Available Endpoints

### OAuth Server Endpoints
- `GET /auth/facebook?user_id=USER_ID` - Initiate OAuth flow
- `GET /auth/facebook/callback` - OAuth callback handler
- `GET /auth/status/:userId` - Check authentication status
- `POST /auth/revoke/:userId` - Revoke user's token
- `GET /auth/debug/:userId` - Debug token info (development only)
- `GET /health` - Health check

### MCP Server Endpoints
- `POST /` - Main MCP endpoint for tool calls
- All existing MCP tools with OAuth authentication

## Available MCP Tools

All tools now support OAuth authentication:

- `get_ad_accounts` - Get accessible ad accounts
- `get_campaigns` - Get campaigns for an account
- `create_campaign` - Create new campaigns
- `update_campaign` - Update existing campaigns
- `pause_campaign` - Pause campaigns
- `resume_campaign` - Resume campaigns
- `get_insights` - Get campaign insights
- `list_ad_creatives` - List ad creatives
- `list_audiences` - List custom audiences
- `health_check` - Server health and auth status

## Authentication Headers

Tools accept access tokens in multiple header formats:

1. **Authorization Bearer token** (recommended):
   ```
   Authorization: Bearer YOUR_ACCESS_TOKEN
   ```

2. **X-Access-Token header**:
   ```
   X-Access-Token: YOUR_ACCESS_TOKEN
   ```

3. **X-Meta-Access-Token header**:
   ```
   X-Meta-Access-Token: YOUR_ACCESS_TOKEN
   ```

## Security Considerations

1. **Token Storage**: 
   - Development: In-memory storage (tokens lost on restart)
   - Production: Use Redis or secure database storage

2. **Token Encryption**: 
   - All stored tokens are encrypted using AES-256
   - Use a strong encryption key (minimum 32 characters)

3. **HTTPS Required**: 
   - Always use HTTPS in production
   - Facebook requires HTTPS for OAuth callbacks

4. **Token Expiration**:
   - Short-lived tokens expire in 1-2 hours
   - Long-lived tokens expire in 60 days
   - Implement token refresh logic for your application

## Error Handling

The system provides comprehensive error handling:

- **Authentication Errors**: Invalid or expired tokens
- **Authorization Errors**: Insufficient permissions
- **API Errors**: Meta API rate limits or service issues
- **OAuth Errors**: Failed authentication flows

## Development vs Production

### Development
- Use `memory` token storage
- HTTP endpoints are acceptable for localhost
- Debug endpoints available

### Production
- Use `redis` token storage with encryption
- HTTPS required for all endpoints
- Disable debug endpoints
- Use secure environment variable management

## Testing the Integration

1. **Start both servers**:
   ```bash
   # Terminal 1: Start XMCP server
   pnpm dev
   
   # Terminal 2: Start OAuth server
   pnpm dev-oauth
   ```

2. **Test OAuth flow**:
   ```bash
   # Visit this URL in your browser
   http://localhost:3003/auth/facebook?user_id=test_user
   ```

3. **Test MCP tools**:
   ```bash
   # Check health with auth status
   curl -X POST http://localhost:3002 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"method": "tools/call", "params": {"name": "health_check", "arguments": {}}}'
   ```

## Troubleshooting

### Common Issues

1. **OAuth Callback URL Mismatch**:
   - Ensure `META_REDIRECT_URI` matches Facebook app settings
   - Check for trailing slashes and protocol (http/https)

2. **Token Storage Issues**:
   - Verify encryption key is set and sufficient length
   - Check Redis connection for production setups

3. **Permission Denied**:
   - Ensure required permissions are requested and approved
   - Check Facebook app review status

4. **CORS Issues**:
   - Configure `ALLOWED_ORIGINS` environment variable
   - Ensure your frontend domain is included

### Debug Tools

Use the health check tool to verify authentication:
```bash
curl -X POST http://localhost:3002 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"method": "tools/call", "params": {"name": "health_check", "arguments": {}}}'
```

This will return authentication status and server health information.

## Next Steps

1. **Production Deployment**: Configure HTTPS, Redis, and secure environment variables
2. **Token Refresh**: Implement automatic token refresh logic in your application
3. **User Management**: Build user account management and token association
4. **Monitoring**: Set up logging and monitoring for OAuth flows and API usage

For more information, see the [Meta Marketing API documentation](https://developers.facebook.com/docs/marketing-api).