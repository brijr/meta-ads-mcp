# Dynamic Token Usage Examples

This guide demonstrates how to use the Meta Marketing API MCP Server with dynamic access tokens, providing enhanced security and multi-account management capabilities.

## Overview

Dynamic token authentication allows you to provide Meta access tokens on a per-request basis rather than configuring them as environment variables. This approach offers several benefits:

- **Enhanced Security**: Tokens are only used when needed
- **Multi-Account Support**: Easily switch between different ad accounts
- **Temporary Access**: Grant access without modifying server configuration
- **Token Isolation**: Keep tokens separate for different users or purposes

## Basic Usage

### 1. Health Check with Dynamic Token

```
Check the Meta Marketing API server health using access token EAAxxxxxx
```

### 2. List Ad Accounts

```
Show me all ad accounts accessible with token EAAxxxxxx
```

### 3. Campaign Operations

```
List all active campaigns for account 123456789 using access token EAAxxxxxx
```

```
Create a new traffic campaign named "Summer Sale 2024" with $50 daily budget for account 123456789 using token EAAxxxxxx
```

## Multi-Account Management

### Managing Multiple Accounts

When working with multiple ad accounts that require different access tokens:

```
// Account A Operations
List campaigns for account 111111111 using access token EAAtoken1xxxxx

// Account B Operations  
List campaigns for account 222222222 using access token EAAtoken2xxxxx

// Compare performance across accounts
Compare performance between campaigns from accounts 111111111 and 222222222 using their respective tokens
```

### Switching Between Environments

```
// Development Account
Get insights for campaign 12345 using development token EAAdevTokenxxxxx

// Production Account
Get insights for campaign 67890 using production token EAAprodTokenxxxxx
```

## Advanced Examples

### 1. Campaign Creation with Dynamic Token

```
Create a conversion campaign for account 123456789 with the following details:
- Name: "Q4 Holiday Campaign"
- Objective: OUTCOME_SALES
- Daily Budget: $100
- Status: PAUSED
Use access token EAAxxxxxx
```

### 2. Audience Management

```
Create a custom audience named "Website Visitors - Last 30 Days" for account 123456789 using:
- Subtype: WEBSITE
- Retention days: 30
- Access token: EAAxxxxxx
```

### 3. Performance Analytics

```
Generate a performance report for all campaigns in account 123456789 for the last 30 days including:
- Metrics: impressions, clicks, spend, conversions, ROAS
- Breakdowns: age, gender, placement
- Format: CSV
Use access token EAAxxxxxx
```

### 4. Creative Testing

```
Set up an A/B test for ad creative variations in campaign 12345:
- Test different headlines
- Equal budget split
- 7-day test duration
Use access token EAAxxxxxx for account 123456789
```

## Best Practices

### 1. Token Management

- Store tokens securely in your password manager or secret store
- Never share tokens in public channels or logs
- Use tokens with minimal required permissions
- Rotate tokens regularly for security

### 2. Error Handling

When a token is invalid or expired, you'll see clear error messages:

```
Error: Access token is invalid or expired. Please generate a new token.
```

Simply provide a fresh token with your next request.

### 3. Rate Limiting

Dynamic tokens respect the same rate limits as environment tokens:
- Development tier: 60 API calls per 5 minutes
- Standard tier: 9000 API calls per 5 minutes

### 4. Combining with Environment Tokens

You can use both approaches:
- Set a default token via environment for your primary account
- Use dynamic tokens for secondary accounts or special operations

## Troubleshooting

### Common Issues

1. **"Access token is required" error**
   - Ensure you're including the access token in your request
   - Check that the token parameter is spelled correctly

2. **"Invalid token format" error**
   - Verify your token starts with "EAA"
   - Ensure the token is at least 10 characters long

3. **Permission errors**
   - Confirm your token has `ads_read` and `ads_management` permissions
   - Check that the token has access to the specified ad account

### Getting Help

If you encounter issues:
1. Verify your token is valid using Meta's Access Token Debugger
2. Check the Meta API status page for any ongoing issues
3. Review the error message for specific guidance
4. Consult the Meta Marketing API documentation

## Migration Guide

### From Environment Tokens to Dynamic Tokens

1. **Current Setup** (Environment-based):
   ```json
   {
     "mcpServers": {
       "meta-ads": {
         "command": "meta-ads-mcp",
         "env": {
           "META_ACCESS_TOKEN": "your_token"
         }
       }
     }
   }
   ```

2. **New Setup** (Dynamic tokens):
   ```json
   {
     "mcpServers": {
       "meta-ads": {
         "command": "meta-ads-mcp"
       }
     }
   }
   ```

3. **Update Your Workflows**:
   - Add `using access token EAAxxxxxx` to your commands
   - Store tokens securely outside of configuration files
   - Update any automation scripts to pass tokens dynamically

## Security Considerations

### Why Use Dynamic Tokens?

1. **Reduced Attack Surface**: Tokens aren't stored in configuration files
2. **Audit Trail**: Each request explicitly shows which token was used
3. **Easier Revocation**: Revoke specific tokens without affecting others
4. **Compliance**: Better aligns with security best practices

### Token Security Tips

- Use System User tokens for automation
- Implement token rotation policies
- Monitor token usage via Meta Business Manager
- Use separate tokens for different environments
- Enable two-factor authentication on your Meta account

## Next Steps

1. Generate a new access token from Meta Developer Portal
2. Test dynamic token authentication with a simple request
3. Gradually migrate your workflows to use dynamic tokens
4. Implement token rotation for enhanced security