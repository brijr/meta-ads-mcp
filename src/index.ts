#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MetaApiClient } from './meta-client.js';
import { AuthManager } from './utils/auth.js';
import { registerCampaignTools } from './tools/campaigns.js';
import { registerAnalyticsTools } from './tools/analytics.js';
import { registerAudienceTools } from './tools/audiences.js';
import { registerCreativeTools } from './tools/creatives.js';
import { registerCampaignResources } from './resources/campaigns.js';
import { registerInsightsResources } from './resources/insights.js';
import { registerAudienceResources } from './resources/audiences.js';

async function main() {
  try {
    // Initialize authentication
    const auth = AuthManager.fromEnvironment();
    
    // Skip token validation if no environment token provided
    // Users can provide tokens dynamically via tool parameters
    if (process.env.META_ACCESS_TOKEN) {
      const isValidToken = await auth.validateToken();
      if (!isValidToken) {
        console.error('Invalid Meta access token. Please check your META_ACCESS_TOKEN environment variable.');
        process.exit(1);
      }
      console.error('✅ Environment access token validated');
    } else {
      console.error('⚠️  No environment access token provided. Tokens must be provided via tool parameters.');
    }

    // Initialize Meta API client
    const metaClient = new MetaApiClient(auth);

    // Initialize MCP Server
    const server = new McpServer({
      name: process.env.MCP_SERVER_NAME || 'Meta Marketing API Server',
      version: process.env.MCP_SERVER_VERSION || '1.0.0'
    });

    // Register all tools
    registerCampaignTools(server, metaClient);
    registerAnalyticsTools(server, metaClient);
    registerAudienceTools(server, metaClient);
    registerCreativeTools(server, metaClient);

    // Register all resources
    registerCampaignResources(server, metaClient);
    registerInsightsResources(server, metaClient);
    registerAudienceResources(server, metaClient);

    // Add account discovery tool
    server.tool('get_ad_accounts', {
      access_token: {
        type: 'string',
        description: 'Meta Marketing API access token (if not provided via environment)',
        optional: true
      }
    }, async ({ access_token }) => {
      try {
        const accounts = await metaClient.getAdAccounts(access_token);
        
        const accountsData = accounts.map(account => ({
          id: account.id,
          name: account.name,
          account_status: account.account_status,
          currency: account.currency,
          timezone_name: account.timezone_name,
          balance: account.balance,
          business: account.business ? {
            id: account.business.id,
            name: account.business.name
          } : null
        }));

        const response = {
          success: true,
          accounts: accountsData,
          total_accounts: accountsData.length,
          message: 'Ad accounts retrieved successfully'
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [{
            type: 'text',
            text: `Error getting ad accounts: ${errorMessage}`
          }],
          isError: true
        };
      }
    });

    // Add server health check tool
    server.tool('health_check', {
      access_token: {
        type: 'string',
        description: 'Meta Marketing API access token (if not provided via environment)',
        optional: true
      }
    }, async ({ access_token }) => {
      try {
        const accounts = await metaClient.getAdAccounts(access_token);
        const response = {
          status: 'healthy',
          server_name: 'Meta Marketing API Server',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          meta_api_connection: 'connected',
          accessible_accounts: accounts.length,
          rate_limit_status: 'operational',
          features: {
            campaign_management: true,
            analytics_reporting: true,
            audience_management: true,
            creative_management: true,
            real_time_insights: true
          }
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const response = {
          status: 'unhealthy',
          server_name: 'Meta Marketing API Server',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          error: errorMessage,
          meta_api_connection: 'failed'
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }],
          isError: true
        };
      }
    });

    // Add server capabilities info
    server.tool('get_capabilities', {}, async () => {
      const capabilities = {
        server_info: {
          name: 'Meta Marketing API Server',
          version: '1.0.0',
          description: 'MCP server providing access to Meta Marketing API for campaign management, analytics, and audience targeting'
        },
        api_coverage: {
          campaigns: {
            description: 'Full campaign lifecycle management',
            operations: ['create', 'read', 'update', 'delete', 'pause', 'resume'],
            supported_objectives: [
              'OUTCOME_APP_PROMOTION',
              'OUTCOME_AWARENESS', 
              'OUTCOME_ENGAGEMENT',
              'OUTCOME_LEADS',
              'OUTCOME_SALES',
              'OUTCOME_TRAFFIC'
            ]
          },
          ad_sets: {
            description: 'Ad set management and targeting',
            operations: ['create', 'read', 'update', 'list'],
            targeting_options: ['demographics', 'interests', 'behaviors', 'custom_audiences', 'lookalike_audiences', 'geographic']
          },
          ads: {
            description: 'Individual ad management',
            operations: ['create', 'read', 'update', 'list'],
            supported_formats: ['single_image', 'carousel', 'video', 'collection']
          },
          insights: {
            description: 'Performance analytics and reporting',
            metrics: ['impressions', 'clicks', 'spend', 'reach', 'frequency', 'ctr', 'cpc', 'cpm', 'conversions'],
            breakdowns: ['age', 'gender', 'placement', 'device', 'country'],
            date_ranges: ['today', 'yesterday', 'last_7d', 'last_30d', 'last_90d', 'custom']
          },
          audiences: {
            description: 'Custom and lookalike audience management',
            types: ['custom', 'lookalike', 'website', 'app', 'offline'],
            operations: ['create', 'read', 'update', 'delete', 'estimate_size']
          },
          creatives: {
            description: 'Ad creative management and testing',
            operations: ['create', 'read', 'preview', 'ab_test_setup'],
            formats: ['image', 'video', 'carousel', 'collection']
          }
        },
        tools_available: [
          // Campaign tools
          'list_campaigns', 'create_campaign', 'update_campaign', 'delete_campaign',
          'pause_campaign', 'resume_campaign', 'get_campaign',
          // Ad set tools  
          'list_ad_sets', 'create_ad_set',
          // Ad tools
          'list_ads',
          // Analytics tools
          'get_insights', 'compare_performance', 'export_insights', 
          'get_campaign_performance', 'get_attribution_data',
          // Audience tools
          'list_audiences', 'create_custom_audience', 'create_lookalike_audience',
          'estimate_audience_size',
          // Creative tools
          'list_creatives', 'create_ad_creative', 'preview_ad', 'setup_ab_test',
          // Utility tools
          'get_ad_accounts', 'health_check', 'get_capabilities'
        ],
        resources_available: [
          'meta://campaigns/{account_id}',
          'meta://campaign/{campaign_id}', 
          'meta://campaign-status/{account_id}',
          'meta://adsets/{campaign_id}',
          'meta://insights/campaign/{campaign_id}',
          'meta://insights/account/{account_id}',
          'meta://insights/compare/{object_ids}',
          'meta://insights/trends/{object_id}/{days}',
          'meta://audiences/{account_id}',
          'meta://audience-performance/{account_id}',
          'meta://targeting-insights/{account_id}',
          'meta://audience-health/{account_id}'
        ],
        rate_limits: {
          development_tier: {
            max_score: 60,
            decay_time: '5 minutes',
            block_time: '5 minutes'
          },
          standard_tier: {
            max_score: 9000,
            decay_time: '5 minutes',
            block_time: '1 minute'
          },
          scoring: {
            read_calls: 1,
            write_calls: 3
          }
        },
        authentication: {
          required: ['META_ACCESS_TOKEN'],
          optional: ['META_APP_ID', 'META_APP_SECRET', 'META_BUSINESS_ID'],
          token_validation: 'automatic_on_startup'
        }
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(capabilities, null, 2)
        }]
      };
    });

    console.error('Meta Marketing API MCP Server starting...');
    console.error(`Server: ${process.env.MCP_SERVER_NAME || 'Meta Marketing API Server'} v${process.env.MCP_SERVER_VERSION || '1.0.0'}`);
    console.error(`Meta API Version: ${auth.getApiVersion()}`);
    console.error('Validating authentication...');

    // Connect to transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('✅ Meta Marketing API MCP Server started successfully');
    console.error('Ready to receive requests from MCP clients');

  } catch (error) {
    console.error('❌ Failed to start Meta Marketing API MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}