#!/usr/bin/env node

/**
 * Runware MCP Server - Main Entry Point
 *
 * Wires together all tools, resources, and prompt templates into
 * a functioning MCP server using stdio transport.
 *
 * Startup sequence:
 * 1. Config validation (fail fast if RUNWARE_API_KEY is missing)
 * 2. Database initialization (optional, non-fatal)
 * 3. Runware client creation
 * 4. MCP server creation with capability registration
 * 5. Handler registration (tools, resources, prompts)
 * 6. Graceful shutdown signal handlers
 * 7. Transport binding and server start
 */

import { randomUUID } from 'node:crypto';
import process from 'node:process';

// Using the low-level Server API intentionally for custom tool dispatch.
// The McpServer high-level API doesn't support our pre-built handler registry pattern.
// eslint-disable-next-line sonarjs/deprecation -- Low-level API required for custom tool registry dispatch
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { createRunwareClient } from './integrations/runware/client.js';
import { PROMPT_TEMPLATES } from './prompts/index.js';
import { findProviderForUri, RESOURCE_PROVIDERS } from './resources/index.js';
import {
  completeOperation,
  createCancellableOperation,
} from './server/cancellation.js';
import { setupDatabase, teardownDatabase } from './server/database-integration.js';
import { createProgressReporter } from './server/progress.js';
import { config } from './shared/config.js';
import { toolDefinitions, toolHandlers } from './tools/index.js';
import { stopAllWatchers } from './tools/watch-folder/index.js';

import type { ToolResult } from './shared/types.js';

// ============================================================================
// Constants
// ============================================================================

const SERVER_NAME = 'runware-mcp';
const SERVER_VERSION = '1.0.0';
const LOG_PREFIX = `[${SERVER_NAME}]`;

// ============================================================================
// Logging (stderr only - stdout is for MCP protocol)
// ============================================================================

/**
 * Writes a log message to stderr.
 */
function log(message: string): void {
  process.stderr.write(`${LOG_PREFIX} ${message}\n`);
}

// ============================================================================
// Tool Handler Dispatch
// ============================================================================

/**
 * Tool handler function type.
 *
 * All tool handlers share this common signature:
 * (input, client?, context?) => Promise<ToolResult>
 */
type ToolHandlerFunction = (typeof toolHandlers)[keyof typeof toolHandlers];

/**
 * Finds a tool handler by name.
 *
 * Iterates over toolHandlers entries to avoid object injection
 * from dynamic property access (security/detect-object-injection).
 *
 * @param name - The tool name to look up
 * @returns The handler function, or undefined if not found
 */
function findToolHandler(name: string): ToolHandlerFunction | undefined {
  for (const [key, handler] of Object.entries(toolHandlers)) {
    if (key === name) {
      return handler as ToolHandlerFunction;
    }
  }
  return undefined;
}

// ============================================================================
// Prompt Template Lookup
// ============================================================================

/**
 * Finds a prompt template by name.
 *
 * Iterates over PROMPT_TEMPLATES entries to avoid object injection.
 *
 * @param name - The prompt template name to look up
 * @returns The template, or undefined if not found
 */
function findPromptByName(name: string): (typeof PROMPT_TEMPLATES)[string] | undefined {
  for (const [key, template] of Object.entries(PROMPT_TEMPLATES)) {
    if (key === name) {
      return template;
    }
  }
  return undefined;
}

// ============================================================================
// Main
// ============================================================================

/**
 * Main server entry point.
 *
 * Initializes all subsystems and starts the MCP server.
 */
async function main(): Promise<void> {
  // 1. Config is validated at import time by shared/config.ts
  //    If RUNWARE_API_KEY is missing or invalid, the process has already exited.
  log(`Starting server v${SERVER_VERSION}`);

  // 2. Initialize database (optional, non-fatal)
  setupDatabase();

  // 3. Create Runware API client
  const client = createRunwareClient();

  // 4. Create MCP server
  // eslint-disable-next-line sonarjs/deprecation, @typescript-eslint/no-deprecated -- Low-level API required for custom tool registry dispatch
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // 5. Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, () =>
    Promise.resolve({ tools: toolDefinitions }),
  );

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    const handler = findToolHandler(name);

    if (handler === undefined) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ status: 'error', message: `Unknown tool: ${name}` }) }],
        isError: true,
      };
    }

    // Use client-provided progressToken or generate a unique ID
    const meta = request.params._meta;
    const progressToken = meta?.progressToken;
    const requestId = progressToken === undefined
      ? randomUUID()
      : String(progressToken);

    // Register this operation for cancellation tracking
    createCancellableOperation(requestId);
    const progress = createProgressReporter(requestId, (params) => {
      void server.notification({
        method: 'notifications/progress',
        params,
      });
    });

    // Use the SDK-provided signal for cancellation awareness.
    // When the client cancels, extra.signal aborts.
    const effectiveSignal = extra.signal;

    try {
      const result: ToolResult = await handler(
        (args ?? {}) as never, // Handler validates its own input via Zod
        client,
        { signal: effectiveSignal, progress },
      );
      completeOperation(requestId);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        isError: result.status === 'error',
      };
    } catch (error) {
      completeOperation(requestId);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ status: 'error', message: errorMessage }) }],
        isError: true,
      };
    }
  });

  // 6. Register resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = [];
    for (const provider of RESOURCE_PROVIDERS) {
      const entries = await provider.list();
      resources.push(...entries);
    }
    return { resources };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const provider = findProviderForUri(uri);
    if (provider === undefined) {
      throw new Error(`No resource provider for URI: ${uri}`);
    }
    const content = await provider.get(uri);
    if (content === null) {
      throw new Error(`Resource not found: ${uri}`);
    }
    return {
      contents: [content],
    };
  });

  // 7. Register prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, () =>
    Promise.resolve({
      prompts: Object.entries(PROMPT_TEMPLATES).map(([name, template]) => ({
        name,
        description: template.description,
        arguments: template.arguments,
      })),
    }),
  );

  server.setRequestHandler(GetPromptRequestSchema, (request) => {
    const { name, arguments: args } = request.params;
    const template = findPromptByName(name);
    if (template === undefined) {
      throw new Error(`Unknown prompt template: ${name}`);
    }
    const messages = template.generate(args ?? {});
    return Promise.resolve({
      messages: messages.map((msg) => ({
        role: msg.role,
        content: { type: 'text' as const, text: msg.content },
      })),
    });
  });

  // 8. Graceful shutdown handlers
  const shutdown = async (): Promise<void> => {
    log('Shutting down...');
    stopAllWatchers();
    teardownDatabase();
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });

  process.on('SIGTERM', () => {
    void shutdown();
  });

  // 9. Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  log('Server started successfully');
  log(`Tools: ${String(toolDefinitions.length)}`);
  log(`Resources: ${String(RESOURCE_PROVIDERS.length)} providers`);
  log(`Prompts: ${String(Object.keys(PROMPT_TEMPLATES).length)} templates`);
  log(`Database: ${config.ENABLE_DATABASE ? 'enabled' : 'disabled'}`);
}

// ============================================================================
// Bootstrap
// ============================================================================

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${LOG_PREFIX} Fatal error: ${message}\n`);
  process.exit(1);
});
