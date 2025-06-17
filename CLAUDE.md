# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive Model Context Protocol (MCP) server that provides AI assistants with access to Meta Marketing API for Facebook/Instagram advertising management. The server implements 40+ tools and 12 resources covering campaign management, analytics, audience targeting, and creative optimization.

## Commands

### Development
- Install dependencies: `npm install`
- Build TypeScript: `npm run build`
- Run in development: `npm run dev`
- Lint code: `npm run lint`
- Run tests: `npm test`

### Testing
- Run all tests: `npm test`
- Run specific test file: `npx jest path/to/file.test.ts`
- Run tests matching pattern: `npx jest -t "test name"`

### Production
- Build for production: `npm run build`
- Run built server: `node build/index.js`
- Install globally: `npm install -g .`

## Architecture

### Core Components

The server follows a modular architecture with clear separation of concerns:

**`src/index.ts`** - Main entry point that:
- Initializes authentication and validates Meta access tokens
- Creates McpServer instance and registers all tools/resources
- Handles graceful startup, shutdown, and error recovery
- Connects via StdioServerTransport for MCP communication

**`src/meta-client.ts`** - Central Meta API client that:
- Handles authentication, rate limiting, and request retries
- Provides typed methods for all Meta Marketing API endpoints
- Implements automatic pagination and error handling
- Manages per-account rate limiting with exponential backoff

**`src/utils/`** - Core utilities:
- `auth.ts` - OAuth 2.0 and access token management
- `rate-limiter.ts` - Per-account rate limiting (60/9000 requests per 5min)
- `error-handler.ts` - Meta API error handling with automatic retries
- `pagination.ts` - Efficient pagination for large datasets

### Tool Organization

Tools are organized by functional domain in `src/tools/`:

**`campaigns.ts`** - Campaign lifecycle management (10 tools):
- CRUD operations for campaigns, ad sets, and ads
- Budget management, scheduling, and status changes
- Supports all Meta campaign objectives and optimization goals

**`analytics.ts`** - Performance analytics (6 tools):
- Insights retrieval with custom date ranges and breakdowns
- Performance comparison across multiple objects
- Data export in CSV/JSON formats with attribution modeling

**`audiences.ts`** - Audience management (6 tools):
- Custom audience creation (website, app, customer lists)
- Lookalike audience generation with configurable similarity ratios
- Audience size estimation and targeting recommendations

**`creatives.ts`** - Creative management (8 tools):
- Ad creative creation and management
- Cross-platform preview generation
- A/B testing setup and performance analysis

### Resource Architecture

Resources provide contextual data access through URI patterns in `src/resources/`:

**`campaigns.ts`** - Campaign data resources:
- `meta://campaigns/{account_id}` - Campaign overview and status
- `meta://campaign/{campaign_id}` - Detailed campaign information
- `meta://adsets/{campaign_id}` - Ad set data with targeting info

**`insights.ts`** - Performance data resources:
- `meta://insights/account/{account_id}` - Account performance dashboard
- `meta://insights/campaign/{campaign_id}` - Campaign performance trends
- `meta://insights/compare/{object_ids}` - Multi-object performance comparison

**`audiences.ts`** - Audience data resources:
- `meta://audiences/{account_id}` - Audience overview and health metrics
- `meta://audience-performance/{account_id}` - Audience performance analysis
- `meta://targeting-insights/{account_id}` - Targeting recommendations

### Type System

**`src/types/meta-api.ts`** - Complete Meta API type definitions:
- Comprehensive interfaces for all Meta Marketing API objects
- Campaign, AdSet, Ad, AdCreative, AdInsights, CustomAudience types
- Error handling and response pagination types

**`src/types/mcp-tools.ts`** - MCP tool parameter schemas:
- Zod schemas for all tool parameter validation
- Runtime type inference for TypeScript safety
- Input validation with descriptive error messages

## Key Design Patterns

### Rate Limiting Strategy
- Per-account rate limiting with separate scoring for read (1 point) vs write (3 points) operations
- Automatic retry with exponential backoff for rate limit and server errors
- Development tier (60 points/5min) vs Standard tier (9000 points/5min) support

### Error Handling Philosophy
- Comprehensive error categorization (auth, permission, validation, rate limit)
- Automatic retry logic with intelligent backoff strategies
- Graceful degradation with detailed error messages for debugging

### Authentication Flow
- Flexible authentication with both environment and per-request token support
- Environment tokens validated on startup with clear error messages
- Dynamic tokens can be provided with any tool call via `access_token` parameter
- Support for multiple Meta Business accounts via configuration or dynamic tokens
- No environment configuration required when using dynamic tokens

### Resource Pattern
- URI-based resource access following RESTful patterns
- Dynamic resource generation with template parameters
- Rich contextual data for AI understanding and decision making

## Configuration

### Required Environment Variables
- `META_ACCESS_TOKEN` - Meta Marketing API access token (optional - can be provided per-request)
- `META_APP_ID`, `META_APP_SECRET` - Optional for advanced authentication
- `META_BUSINESS_ID` - Optional for multi-business account management
- `META_API_VERSION` - API version (defaults to v23.0)
- `META_API_TIER` - Rate limit tier: 'development' or 'standard'

### Dynamic Authentication
All tools accept an optional `access_token` parameter that overrides the environment token. This enables:
- Multi-account management with different tokens
- Enhanced security through token isolation
- Temporary access without configuration changes

### Claude Desktop Integration
The server integrates with Claude Desktop via MCP configuration in `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "meta-ads-mcp",
      "env": {
        "META_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```