# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Meta (Facebook) Marketing API MCP (Model Context Protocol) Server built using the XMCP framework. It provides tools for interacting with Meta's advertising platform through a standardized protocol that can be consumed by AI applications and LLMs.

## Development Commands

```bash
# Development with hot reloading
pnpm dev

# Build for production
pnpm build

# Run servers
pnpm start-http  # HTTP server on port 3002
pnpm start-stdio  # STDIO server
```

## Architecture

### Tool Structure
Each tool in `src/tools/` must export three components:
1. **schema** - Zod schema defining input parameters with descriptions
2. **metadata** - Tool configuration object with:
   - `name`: Tool identifier (usually snake_case)
   - `description`: What the tool does
   - `annotations`: Optional hints (title, readOnlyHint, destructiveHint, idempotentHint)
3. **default export** - Async function implementing the tool logic

Tools receive parameters as first argument and context as second argument. The context contains headers for authentication.

### Key Dependencies
- **MetaContext** (`@/lib/shared/meta-context`) - Wrapper for Meta API client
- **XMCPAuthMiddleware** (`@/lib/shared/xmcp-auth-middleware`) - Authentication handling

### Adding New Tools
1. Create a new `.ts` file in `src/tools/`
2. Define the three required exports:
   ```typescript
   export const schema = { /* Zod schema */ }
   export const metadata = { /* Tool config */ }
   export default async function toolName(params, context) { /* Implementation */ }
   ```
3. Use `MetaContext.withClient()` for Meta API operations
4. Return responses in MCP format (typically with content array)
5. Tools are automatically discovered by XMCP - no registration needed

### Server Configuration
- HTTP server runs on port 3002 (configured in `xmcp.config.ts`)
- Both HTTP and STDIO transports are supported
- Authentication is handled via headers passed in the context

## OAuth Authentication

The server now supports OAuth2 authentication with Facebook:

### Setup Commands
```bash
# Copy environment template
cp .env.example .env

# Install dependencies
pnpm install

# Start OAuth server (port 3003)
pnpm dev-oauth

# Start XMCP server (port 3002)
pnpm dev
```

### Authentication Flow
1. Direct users to `/auth/facebook?user_id=USER_ID` on OAuth server
2. Handle callback at `/auth/facebook/callback`
3. Include access token in MCP tool headers: `Authorization: Bearer TOKEN`

### Key Environment Variables
- `META_APP_ID` - Facebook app ID
- `META_APP_SECRET` - Facebook app secret
- `META_REDIRECT_URI` - OAuth callback URL
- `TOKEN_ENCRYPTION_KEY` - Token encryption key (32+ chars)

## Important Notes

- No test framework is currently set up
- Use pnpm as the package manager (not npm or yarn)
- TypeScript strict mode is enabled
- All tools should be idempotent where possible
- Tools interacting with Meta API should use the provided MetaContext wrapper
- OAuth authentication is required for all Meta API operations
- See README-OAUTH.md for complete authentication setup guide