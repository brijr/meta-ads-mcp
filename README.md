# Meta Marketing API MCP Server

A comprehensive Model Context Protocol (MCP) server that enables AI assistants like Claude to interact with Facebook/Instagram advertising data through the Meta Marketing API. This server provides full campaign lifecycle management, analytics, audience targeting, and creative optimization capabilities.

## 🚀 Features

### **Campaign Management**
- ✅ Create, update, pause, resume, and delete campaigns
- ✅ Support for all campaign objectives (traffic, conversions, awareness, etc.)
- ✅ Budget management and scheduling
- ✅ Ad set creation with advanced targeting
- ✅ Individual ad management

### **Analytics & Reporting**
- 📊 Performance insights with customizable date ranges
- 📈 Multi-object performance comparison
- 📋 Data export in CSV/JSON formats
- 🎯 Attribution modeling and conversion tracking
- 📅 Daily performance trends analysis

### **Audience Management**
- 👥 Custom audience creation and management
- 🎯 Lookalike audience generation
- 📏 Audience size estimation
- 🔍 Targeting recommendations and insights
- 🏥 Audience health monitoring

### **Creative Management**
- 🎨 Ad creative creation and management
- 👁️ Cross-platform ad previews
- 🧪 A/B testing setup and guidance
- 📸 Creative performance analysis

### **Enterprise Features**
- 🔐 Secure OAuth 2.0 authentication
- ⚡ Automatic rate limiting with exponential backoff
- 🔄 Pagination support for large datasets
- 🛡️ Comprehensive error handling
- 📚 Rich MCP resources for contextual data access
- 🌐 Multi-account support

## 📦 Installation

### Option 1: NPM (Recommended)
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

## 🔧 Quick Setup

### 1. Get Meta Access Token
1. Create a Meta App at [developers.facebook.com](https://developers.facebook.com/)
2. Add Marketing API product
3. Generate an access token with `ads_read` and `ads_management` permissions

![CleanShot 2025-06-17 at 15 52 35@2x](https://github.com/user-attachments/assets/160a260f-8f1b-44de-9041-f684a47e4a9d)


### 2. Configure Claude Desktop
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "npx",
      "args": ["-y", "meta-ads-mcp"],
      "env": {
        "META_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop
The server will be available for use with Claude.

## 🛠️ Usage Examples

### Campaign Management
```
Create a new traffic campaign named "Holiday Sale 2024" with a $50 daily budget
```

```
List all active campaigns and show their performance for the last 7 days
```

```
Pause all campaigns with CPC above $2.00
```

### Analytics & Reporting
```
Compare the performance of my top 3 campaigns over the last 30 days
```

```
Export campaign performance data for last quarter as CSV
```

```
Show me daily performance trends for campaign 123456 over the last 14 days
```

### Audience Management
```
Create a lookalike audience based on my best customers targeting US users
```

```
Estimate the audience size for females aged 25-45 interested in fitness
```

```
Show me the health status of all my custom audiences
```

### Creative Management
```
Create an ad creative with title "Summer Sale" and preview it for mobile feed
```

```
Set up an A/B test comparing different headlines for my campaign
```

## 📚 Resources Access

The server provides rich contextual data through MCP resources:

- `meta://campaigns/{account_id}` - Campaign overview
- `meta://insights/account/{account_id}` - Performance dashboard
- `meta://audiences/{account_id}` - Audience insights
- `meta://audience-health/{account_id}` - Audience health report

## 🔧 Configuration

### Environment Variables
```bash
# Required
META_ACCESS_TOKEN=your_access_token_here

# Optional
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_BUSINESS_ID=your_business_id
META_API_VERSION=v23.0
META_API_TIER=standard  # or 'development'
```

### Advanced Configuration
See [Configuration Guide](docs/configuration.md) for detailed setup options.

## 📖 Documentation

- **[Setup Guide](docs/setup.md)** - Complete installation and configuration
- **[Tools Reference](docs/tools-reference.md)** - All available tools and resources
- **[Configuration Guide](docs/configuration.md)** - Advanced configuration options

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Claude AI     │◄──►│ MCP Server       │◄──►│ Meta Marketing  │
│                 │    │                  │    │ API             │
│ - Natural       │    │ - Authentication │    │                 │
│   Language      │    │ - Rate Limiting  │    │ - Campaigns     │
│ - Tool Calls    │    │ - Error Handling │    │ - Analytics     │
│ - Resource      │    │ - Data Transform │    │ - Audiences     │
│   Access        │    │ - Pagination     │    │ - Creatives     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Components

- **Meta API Client**: Handles authentication, rate limiting, and API communication
- **Tool Handlers**: 40+ tools for comprehensive Meta API functionality
- **Resource Providers**: Contextual data access for AI understanding
- **Error Management**: Robust error handling with automatic retries
- **Rate Limiter**: Intelligent rate limiting with per-account tracking

## 🔒 Security & Best Practices

### Token Security
- ✅ Environment variable configuration
- ✅ No token logging or exposure
- ✅ Automatic token validation
- ✅ Secure credential management

### API Management
- ✅ Rate limit compliance
- ✅ Exponential backoff retries
- ✅ Request validation
- ✅ Error boundary protection

### Data Privacy
- ✅ Meta data use policy compliance
- ✅ No persistent data storage
- ✅ Secure API communication
- ✅ Audit trail support

## ⚡ Performance

### Rate Limits
- **Development Tier**: 60 API calls per 5 minutes
- **Standard Tier**: 9000 API calls per 5 minutes
- **Automatic Management**: Built-in rate limiting and retry logic

### Optimization
- 🚀 Concurrent request processing
- 📦 Efficient pagination handling
- 🎯 Smart data caching
- ⚡ Minimal memory footprint

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Test with example client:
```bash
npx tsx examples/client-example.ts
```

Health check:
```bash
# In Claude:
Check the health of the Meta Marketing API server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Submit a pull request

### Development Setup
```bash
git clone https://github.com/your-org/meta-ads-mcp.git
cd meta-ads-mcp
npm install
npm run dev  # Start in development mode
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Open an issue on GitHub
- **Meta API**: Refer to [Meta Marketing API docs](https://developers.facebook.com/docs/marketing-apis/)
- **MCP Protocol**: See [Model Context Protocol specification](https://modelcontextprotocol.io/)

## 🏷️ Version History

### v1.0.6 (Latest)
- ✅ Using Meta Graph API v23.0 (latest version)
- ✅ Added support for Outcome-Driven Ad Experience (ODAE) objectives
- ✅ Added campaign-level budget optimization support
- ✅ Added bid strategy options (LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP)
- ✅ Removed deprecated insights metrics per Meta API v19.0 changes
- ✅ Enhanced campaign creation with bid cap and budget optimization features

### v1.0.5
- ✅ Fixed ad set creation to use correct account endpoint
- ✅ Improved error handling for campaign operations

### v1.0.4
- ✅ Enhanced campaign management features
- ✅ Improved API error responses

### v1.0.3
- ✅ Added docker support
- ✅ Improved deployment options

### v1.0.2
- ✅ Fixed entry point issue for npx compatibility
- ✅ Added detailed startup debugging logs
- ✅ Improved error handling and diagnostics

### v1.0.1
- ✅ Enhanced debugging capabilities
- ✅ Better error reporting

### v1.0.0
- ✅ Complete Meta Marketing API integration
- ✅ 40+ tools and resources
- ✅ Advanced rate limiting
- ✅ Comprehensive error handling
- ✅ Multi-account support
- ✅ Production-ready security

---

**Built with ❤️ for the AI-powered advertising future**
