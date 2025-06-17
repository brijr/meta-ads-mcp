# Meta Marketing API MCP Server Setup Guide

This guide will walk you through setting up and configuring the Meta Marketing API MCP Server for use with AI assistants like Claude.

## Prerequisites

- Node.js 18.0.0 or higher
- A Meta Developer Account
- A Meta App with Marketing API access
- An active Meta Ad Account

## 1. Meta App Setup

### Create a Meta App

1. Go to the [Meta for Developers](https://developers.facebook.com/) portal
2. Click "Create App" in the top right corner
3. Select "Other" for use case, then "Business" for app type
4. Provide your app details:
   - **App Name**: Choose a descriptive name
   - **Contact Email**: Your email address
   - **Business Manager Account**: Select your business (optional)

### Add Marketing API Product

1. In your app dashboard, click "Add Product"
2. Find "Marketing API" and click "Set Up"
3. You'll be granted Standard Access by default (60 API calls per hour)
4. For production use, apply for Advanced Access (9000 API calls per hour)

### Generate Access Token

1. In your app dashboard, go to "Tools" → "Access Token Tool"
2. Select the permissions you need:
   - `ads_read` - Required for reading campaign data
   - `ads_management` - Required for creating/updating campaigns
3. Generate a User Access Token or System User Token
4. **Important**: Save this token securely - you'll need it for configuration

### App Review (Optional but Recommended)

For production use and higher rate limits:
1. Go to "App Review" → "Permissions and Features"
2. Request Advanced Access for:
   - `ads_management`
   - `ads_read`
3. Provide detailed use case information
4. Submit for review (typically takes 3-7 business days)

## 2. Installation

### Option 1: NPM Installation (Recommended)

```bash
npm install -g meta-ads-mcp
```

### Option 2: From Source

```bash
git clone https://github.com/your-org/meta-ads-mcp.git
cd meta-ads-mcp
npm install
npm run build
```

## 3. Configuration

### Authentication Methods

#### Method 1: Environment Variable (Traditional)

Set your access token as an environment variable for automatic authentication:

```bash
# Required for environment-based auth
META_ACCESS_TOKEN=your_access_token_here

# Optional
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_BUSINESS_ID=your_business_id
META_API_VERSION=v23.0
META_API_TIER=standard  # or 'development'
MCP_SERVER_NAME=Meta Marketing API Server
MCP_SERVER_VERSION=1.0.0
LOG_LEVEL=info
```

#### Method 2: Dynamic Token Authentication (New!)

With dynamic authentication, you don't need to set any environment variables. Instead, you provide your access token with each tool call. This is ideal for:
- Managing multiple ad accounts with different tokens
- Enhanced security through token isolation
- Temporary access without configuration changes

### Claude Desktop Configuration

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Option A: With Environment Token
```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "meta-ads-mcp",
      "env": {
        "META_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

#### Option B: With Dynamic Tokens
```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "meta-ads-mcp"
    }
  }
}
```

For development/local setup:
```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "npx",
      "args": ["tsx", "/path/to/meta-ads-mcp/src/index.ts"],
      "env": {
        "META_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

## 4. Verification

### Test the Connection

#### With Environment Token:

1. **Check Server Health**:
   ```
   Ask Claude: "Check the health of the Meta Marketing API server"
   ```

2. **List Ad Accounts**:
   ```
   Ask Claude: "Show me my Meta ad accounts"
   ```

#### With Dynamic Token:

1. **Check Server Health with Token**:
   ```
   Ask Claude: "Check the health of the Meta Marketing API server using access token EAAxxxxxx"
   ```

2. **List Ad Accounts with Token**:
   ```
   Ask Claude: "Show me ad accounts using access token EAAxxxxxx"
   ```

3. **Campaign Operations with Token**:
   ```
   Ask Claude: "List campaigns for account 123456789 using access token EAAxxxxxx"
   ```

### Common Issues and Solutions

**Invalid Access Token**
- Error: "Invalid Meta access token"
- Solution: Generate a new token from the Meta Developer portal
- Make sure the token has the correct permissions

**Rate Limit Exceeded**
- Error: "Rate limit exceeded"
- Solution: Wait for the rate limit to reset or upgrade to Advanced Access
- Monitor your API usage in the Meta Developer portal

**Account Access Issues**
- Error: "Cannot access ad account"
- Solution: Ensure your app has permission to access the ad account
- Check that the account is active and properly configured

**Connection Timeouts**
- Error: "Request timeout"
- Solution: Check your internet connection
- Verify Meta API status at [Facebook Status](https://status.facebook.com/)

## 5. Security Best Practices

### Token Security
- Never commit access tokens to version control
- Use environment variables or secure secret management
- Consider using dynamic tokens for enhanced security
- Rotate tokens regularly (recommended every 60 days)
- Use the minimum required permissions
- Dynamic tokens provide better isolation between accounts

### Network Security
- Use HTTPS for all communications
- Consider using a proxy for additional security
- Monitor API usage for unusual patterns

### Data Privacy
- Follow Meta's data use policies
- Implement proper data retention policies
- Ensure GDPR/CCPA compliance if applicable

## 6. Monitoring and Maintenance

### Monitor API Usage
- Check rate limit status regularly
- Monitor for error patterns
- Set up alerts for failures

### Keep Updated
- Update the MCP server regularly
- Monitor Meta API changelog for breaking changes
- Test new features in development before production

### Backup and Recovery
- Backup campaign configurations
- Document your setup for disaster recovery
- Test restoration procedures

## Next Steps

1. Review the [Configuration Guide](configuration.md) for advanced settings
2. Check the [Tools Reference](tools-reference.md) for available functionality
3. Try the example workflows in the [Examples](../examples/) directory
4. Monitor your setup and optimize based on usage patterns

## Support

For issues and questions:
- Check the [Troubleshooting](troubleshooting.md) guide
- Review Meta Marketing API documentation
- Open an issue on the project repository
- Contact Meta Developer Support for API-specific issues
