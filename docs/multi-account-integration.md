# Multi-Account Meta Ads MCP Server Integration Guide

This guide explains how to integrate your external application with the Multi-Account Meta Ads MCP Server to enable per-user, per-account chat sessions with Meta advertising data.

## Overview

The Multi-Account MCP Server enables:
- **User Authentication**: OAuth flow for Meta account access
- **Account Selection**: Users can choose which ad account to work with
- **Account-Scoped Chat**: Each user+account combination gets its own MCP server instance
- **Session Management**: Secure session handling with automatic cleanup

## Architecture

```
Your App → Multi-Account MCP Server → Account-Scoped MCP Instance → Meta Ads API
     ↓                    ↓                       ↓
  User Auth          Session Mgmt           Account-Specific Tools
```

## Integration Flow

### 1. Prerequisites

```bash
# Install dependencies in your project
npm install express cors

# Set up environment variables
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://your-app.com/auth/meta/callback
REDIS_URL=redis://localhost:6379  # or KV_REST_API_URL for Vercel KV
```

### 2. Start the Multi-Account MCP Server

```bash
# Start the server on port 3001
npm run start:multi-account

# Or programmatically
import { MultiAccountMcpServer } from './src/multi-account-server.js';
const server = new MultiAccountMcpServer(3001);
await server.start();
```

### 3. Integration Code Examples

#### Basic Integration (Node.js/TypeScript)

```typescript
import { ExternalAppClient } from './src/client/external-app-client.js';

class MyAppMetaIntegration {
  private mcpClient: ExternalAppClient;

  constructor() {
    this.mcpClient = new ExternalAppClient('http://localhost:3001');
  }

  // Step 1: Start OAuth flow
  async startUserAuth(): Promise<string> {
    const result = await this.mcpClient.startAuth(
      'https://myapp.com/auth/meta/callback'
    );

    // Redirect user to result.authUrl
    return result.authUrl;
  }

  // Step 2: Handle OAuth callback
  async handleAuthCallback(code: string, state: string) {
    const result = await this.mcpClient.handleAuthCallback(code, state);

    // Store session and show account selection
    return {
      sessionId: result.session.sessionId,
      user: result.session,
      accounts: result.session.availableAccounts
    };
  }

  // Step 3: User selects account
  async selectAccount(sessionId: string, accountId: string) {
    const result = await this.mcpClient.setupAccountMcp(sessionId, accountId);

    // Now user can chat with this specific account
    return result.mcpConnection;
  }
}
```

#### Express.js Integration

```typescript
import express from 'express';
import { ExternalAppClient } from './src/client/external-app-client.js';

const app = express();
const mcpClient = new ExternalAppClient('http://localhost:3001');

// Store user sessions (use proper session management in production)
const userSessions = new Map();

// Start OAuth flow
app.get('/auth/meta', async (req, res) => {
  try {
    const authUrl = await mcpClient.startAuth(
      'https://myapp.com/auth/meta/callback'
    );
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle OAuth callback
app.get('/auth/meta/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const result = await mcpClient.handleAuthCallback(code, state);

    // Store session
    userSessions.set(result.session.sessionId, result.session);

    // Redirect to account selection page
    res.redirect(`/select-account?session=${result.session.sessionId}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Account selection endpoint
app.post('/api/select-account', async (req, res) => {
  try {
    const { sessionId, accountId } = req.body;

    const mcpConnection = await mcpClient.setupAccountMcp(sessionId, accountId);

    res.json({
      success: true,
      mcpConnection,
      message: 'Account selected. Ready for chat!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### React Integration

```tsx
import React, { useState, useEffect } from 'react';
import { ExternalAppClient, AccountInfo } from './client/external-app-client';

const MetaAccountSelector: React.FC = () => {
  const [mcpClient] = useState(() => new ExternalAppClient('http://localhost:3001'));
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      handleAuthCallback(code, state);
    }
  }, []);

  const handleAuthCallback = async (code: string, state: string) => {
    try {
      const result = await mcpClient.handleAuthCallback(code, state);
      setSessionId(result.session.sessionId);
      setAccounts(result.session.availableAccounts);
    } catch (error) {
      console.error('Auth callback failed:', error);
    }
  };

  const startAuth = async () => {
    try {
      const authUrl = await mcpClient.startAuth('https://myapp.com/auth/callback');
      window.location.href = authUrl;
    } catch (error) {
      console.error('Auth start failed:', error);
    }
  };

  const selectAccount = async (accountId: string) => {
    if (!sessionId) return;

    try {
      await mcpClient.setupAccountMcp(sessionId, accountId);
      setSelectedAccount(accountId);
      // Now you can start the chat interface for this account
    } catch (error) {
      console.error('Account selection failed:', error);
    }
  };

  if (!sessionId) {
    return (
      <button onClick={startAuth}>
        Connect Meta Ads Account
      </button>
    );
  }

  if (!selectedAccount) {
    return (
      <div>
        <h3>Select an Ad Account:</h3>
        {accounts.map(account => (
          <div key={account.id} onClick={() => selectAccount(account.id)}>
            <h4>{account.name}</h4>
            <p>Currency: {account.currency}</p>
            <p>Status: {account.status}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3>Ready to chat with account: {selectedAccount}</h3>
      {/* Your chat interface here */}
    </div>
  );
};
```

### 4. MCP Tools Available per Account

Once a user selects an account, they get access to these account-scoped tools:

```typescript
// All tools are automatically scoped to the selected account
const availableTools = [
  'get_account_info',      // Current account information
  'get_campaigns',         // Campaigns in this account
  'create_campaign',       // Create campaign in this account
  'get_insights',          // Analytics for this account
  'list_audiences',        // Custom audiences in this account
  'create_custom_audience', // Create audience in this account
  'list_ad_creatives',     // Ad creatives in this account
  'create_ad_creative',    // Create creative in this account
  // ... all other tools scoped to this account
];
```

### 5. Session Management

```typescript
// Get session information
const session = await mcpClient.getSession(sessionId);

// Clean up when user logs out
await mcpClient.revokeSession(sessionId);

// Health check
const health = await mcpClient.healthCheck();
```

## API Reference

### Authentication Endpoints

#### `POST /api/external/auth`
Start OAuth flow

**Request:**
```json
{
  "redirectUri": "https://your-app.com/callback",
  "state": "optional-external-state"
}
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://facebook.com/oauth/...",
  "state": "internal-state-token",
  "message": "Direct user to authUrl"
}
```

#### `GET /api/external/auth?code=...&state=...`
Handle OAuth callback

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "session-id",
    "userId": "meta-user-id",
    "email": "user@example.com",
    "name": "User Name",
    "availableAccounts": [...]
  }
}
```

### Account Management Endpoints

#### `GET /api/external/accounts?sessionId=...`
Get available accounts

#### `POST /api/external/accounts`
Select an account

**Request:**
```json
{
  "sessionId": "session-id",
  "accountId": "act_123456789"
}
```

### MCP Connection Endpoints

#### `POST /api/external/mcp`
Create MCP connection for selected account

#### `GET /api/external/mcp?sessionId=...&accountId=...`
Get MCP connection info

#### `DELETE /api/external/mcp`
Revoke session and cleanup

## Security Considerations

1. **HTTPS Only**: Use HTTPS in production
2. **CORS Configuration**: Set `ALLOWED_ORIGINS` environment variable
3. **Session Storage**: Use Redis or similar for production session storage
4. **Token Security**: Never expose access tokens to client-side code
5. **Rate Limiting**: Implement rate limiting on your API endpoints

## Production Deployment

### Environment Variables

```bash
# Required
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://your-app.com/auth/meta/callback

# Storage (choose one)
REDIS_URL=redis://your-redis-instance
# OR
KV_REST_API_URL=your-vercel-kv-url
KV_REST_API_TOKEN=your-vercel-kv-token

# Optional
PORT=3001
ALLOWED_ORIGINS=https://your-app.com,https://your-other-domain.com
LOG_LEVEL=info
```

### Docker Deployment

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:multi-account"]
```

### Monitoring

Monitor these metrics:
- Active sessions count
- MCP instances count
- API response times
- Authentication success/failure rates
- Account selection patterns

## Troubleshooting

### Common Issues

1. **"Session not found"**: Check session expiration (7 days default)
2. **"Account not accessible"**: Verify user has access to the account
3. **OAuth failures**: Check Meta app configuration and redirect URI
4. **Storage errors**: Verify Redis/KV connection

### Debug Mode

```bash
LOG_LEVEL=debug npm run start:multi-account
```

## Next Steps

1. Set up your Meta app in Facebook Developers
2. Configure your storage backend (Redis/Vercel KV)
3. Implement the integration code in your app
4. Test the full OAuth → Account Selection → Chat flow
5. Deploy to production with proper security measures

For more examples, see the `/examples` directory in this repository.
