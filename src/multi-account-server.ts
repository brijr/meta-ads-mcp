#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { SessionManager } from "./services/session-manager.js";
import { logger } from "./utils/logger.js";
import { config } from "./config/index.js";

// Import API route handlers
import authHandler from "../api/external/auth.js";
import accountsHandler from "../api/external/accounts.js";
import mcpHandler from "../api/external/mcp.js";

export class MultiAccountMcpServer {
  private app: express.Application;
  private sessionManager: SessionManager;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.sessionManager = SessionManager.getInstance();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS configuration for external apps
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );

    // Parse JSON bodies
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`, {
        body: req.method !== "GET" ? req.body : undefined,
        query: req.query,
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        service: "multi-account-mcp-server",
        timestamp: new Date().toISOString(),
        version: config.getServer().version,
      });
    });

    // External API routes for other apps
    this.app.use("/api/external/auth", authHandler);
    this.app.use("/api/external/accounts", accountsHandler);
    this.app.use("/api/external/mcp", mcpHandler);

    // Session management endpoints
    this.app.delete("/api/external/sessions/:sessionId", async (req, res) => {
      try {
        const { sessionId } = req.params;
        await this.sessionManager.revokeSession(sessionId);
        res.json({ success: true, message: "Session revoked" });
      } catch (error) {
        logger.error("Session revocation error:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to revoke session",
        });
      }
    });

    // Get session info
    this.app.get("/api/external/sessions/:sessionId", async (req, res) => {
      try {
        const { sessionId } = req.params;
        const session = await this.sessionManager.getUserSession(sessionId);

        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        res.json({
          success: true,
          data: {
            sessionId: session.sessionId,
            userId: session.userId,
            email: session.email,
            name: session.name,
            selectedAccountId: session.selectedAccountId,
            availableAccounts: session.availableAccounts,
            createdAt: session.createdAt,
            lastUsed: session.lastUsed,
          },
        });
      } catch (error) {
        logger.error("Get session error:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to get session",
        });
      }
    });

    // Error handling
    this.app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        logger.error("Express error:", error);
        res.status(500).json({
          success: false,
          error: "Internal server error",
          message: error.message,
        });
      }
    );

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: "Endpoint not found",
        path: req.path,
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.app.listen(this.port, () => {
          logger.startup(
            `🚀 Multi-Account MCP Server started on port ${this.port}`
          );
          logger.startup(`📋 Available endpoints:`);
          logger.startup(`   POST /api/external/auth - Start OAuth flow`);
          logger.startup(`   GET  /api/external/auth - OAuth callback`);
          logger.startup(`   GET  /api/external/accounts - Get user accounts`);
          logger.startup(`   POST /api/external/accounts - Select account`);
          logger.startup(`   POST /api/external/mcp - Create MCP connection`);
          logger.startup(`   GET  /api/external/mcp - Get MCP connection`);
          logger.startup(`   DELETE /api/external/mcp - Revoke MCP connection`);
          logger.startup(`✅ Server ready to accept external app connections`);
          resolve();
        });
      } catch (error) {
        logger.error("Failed to start server:", error);
        reject(error);
      }
    });
  }

  setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      // Clean up any resources
      process.exit(0);
    };

    const errorHandler = (error: any, context: string) => {
      logger.error(`${context}:`, error);
      process.exit(1);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("uncaughtException", (error) =>
      errorHandler(error, "Uncaught Exception")
    );
    process.on("unhandledRejection", (reason, promise) => {
      errorHandler({ reason, promise }, "Unhandled Rejection");
    });
  }
}

// Main execution when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    try {
      const port = parseInt(process.env.PORT || "3001", 10);
      const server = new MultiAccountMcpServer(port);
      server.setupGracefulShutdown();
      await server.start();
    } catch (error) {
      logger.error("Failed to start Multi-Account MCP Server:", error);
      process.exit(1);
    }
  }

  main().catch((error) => {
    logger.error("Server startup failed:", error);
    process.exit(1);
  });
}
