/**
 * Shared utilities for formatting API responses consistently
 */

import { logger } from './logger.js';

export interface FormattedResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp?: string;
}

export class ResponseFormatter {
  /**
   * Format a successful response with optional message
   */
  static success(data: any, message?: string): FormattedResponse {
    return {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format an error response
   */
  static error(error: string | Error): FormattedResponse {
    const errorMessage = error instanceof Error ? error.message : error;
    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format API response from Meta API with consistent structure
   */
  static fromApiResponse(response: any, context?: string): FormattedResponse {
    try {
      if (response?.error) {
        logger.warn(`Meta API Error${context ? ` in ${context}` : ''}:`, response.error);
        return ResponseFormatter.error(response.error.message || 'Meta API Error');
      }

      return ResponseFormatter.success(response);
    } catch (error) {
      return ResponseFormatter.error(
        error instanceof Error ? error.message : 'Failed to format API response'
      );
    }
  }

  /**
   * Create paginated response format
   */
  static paginated(data: any[], paging?: any, totalCount?: number): FormattedResponse {
    return ResponseFormatter.success({
      data,
      pagination: {
        total_count: totalCount || data.length,
        has_next_page: !!paging?.next,
        has_previous_page: !!paging?.previous,
        next_cursor: paging?.cursors?.after,
        previous_cursor: paging?.cursors?.before,
      }
    });
  }

  /**
   * Create health check response format
   */
  static healthCheck(status: 'healthy' | 'unhealthy', details: any): FormattedResponse {
    return {
      success: status === 'healthy',
      data: {
        status,
        timestamp: new Date().toISOString(),
        ...details
      }
    };
  }
}