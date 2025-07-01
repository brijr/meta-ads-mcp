/**
 * Centralized logging abstraction to replace scattered console.log statements
 */

import { config } from '../config/index.js';

export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  startup(message: string, ...args: any[]): void;
}

class ConsoleLogger implements Logger {
  private isDebug: boolean;

  constructor() {
    this.isDebug = config.isDebugMode();
  }

  info(message: string, ...args: any[]): void {
    console.log(`ℹ️  ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`⚠️  ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`❌ ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(`🔍 DEBUG: ${message}`, ...args);
    }
  }

  startup(message: string, ...args: any[]): void {
    console.error(`${message}`, ...args);
  }
}

// Export singleton logger instance
export const logger: Logger = new ConsoleLogger();

// Convenience functions for common logging patterns
export const logApiCall = (method: string, endpoint: string, params?: any) => {
  logger.debug(`API Call: ${method} ${endpoint}`, params);
};

export const logApiResponse = (endpoint: string, success: boolean, data?: any) => {
  if (success) {
    logger.debug(`API Response: ${endpoint} - Success`, data);
  } else {
    logger.debug(`API Response: ${endpoint} - Error`, data);
  }
};

export const logError = (context: string, error: any) => {
  logger.error(`${context}:`, error instanceof Error ? error.message : error);
  if (config.isDebugMode() && error instanceof Error && error.stack) {
    logger.debug('Stack trace:', error.stack);
  }
};