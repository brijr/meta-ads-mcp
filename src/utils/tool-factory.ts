/**
 * Tool Factory Pattern to eliminate duplication across MCP tools
 * This replaces the repetitive JSON.stringify and error handling patterns
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logger, logError } from './logger.js';

export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface ToolContext {
  toolName: string;
  description?: string;
}

export type ToolHandler<T = any> = (params: T, context: ToolContext) => Promise<ToolResponse>;

export class ToolFactory {
  private server: McpServer;

  constructor(server: McpServer) {
    this.server = server;
  }

  /**
   * Register a tool with standardized response handling and error management
   */
  public registerTool<T>(
    name: string,
    description: string,
    schema: z.ZodObject<any>,
    handler: ToolHandler<T>
  ): void {
    this.server.tool(name, description, schema.shape, async (args: any) => {
      const context: ToolContext = { toolName: name, description };
      
      try {
        logger.debug(`Executing tool: ${name}`, args);
        
        const result = await handler(args as T, context);
        
        if (result.success) {
          logger.debug(`Tool ${name} completed successfully`);
          return this.formatSuccessResponse(result);
        } else {
          logger.warn(`Tool ${name} failed: ${result.error}`);
          return this.formatErrorResponse(result.error || 'Unknown error occurred');
        }
      } catch (error) {
        logError(`Tool ${name} execution`, error);
        return this.formatErrorResponse(
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      }
    });
  }

  /**
   * Register a simple tool that returns data directly (for backwards compatibility)
   */
  public registerSimpleTool<T>(
    name: string,
    description: string,
    schema: z.ZodObject<any>,
    handler: (params: T) => Promise<any>
  ): void {
    this.registerTool(name, description, schema, async (params: any) => {
      const data = await handler(params as T);
      return { success: true, data };
    });
  }

  /**
   * Create a standardized success response
   */
  private formatSuccessResponse(result: ToolResponse) {
    const response = {
      success: true,
      data: result.data,
      ...(result.message && { message: result.message })
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Create a standardized error response
   */
  private formatErrorResponse(error: string) {
    const response = {
      success: false,
      error,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Helper function to create consistent tool responses
 */
export const createToolResponse = {
  success: (data: any, message?: string): ToolResponse => ({
    success: true,
    data,
    ...(message && { message })
  }),

  error: (error: string): ToolResponse => ({
    success: false,
    error
  }),

  fromApiCall: async <T>(
    apiCall: () => Promise<T>,
    errorContext: string
  ): Promise<ToolResponse> => {
    try {
      const data = await apiCall();
      return createToolResponse.success(data);
    } catch (error) {
      logError(errorContext, error);
      return createToolResponse.error(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
};