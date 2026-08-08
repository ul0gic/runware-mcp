#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
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
import { z } from 'zod';

import { createRunwareClient } from './integrations/runware/client.js';
import { PROMPT_TEMPLATES } from './prompts/index.js';
import { findProviderForUri, RESOURCE_PROVIDERS } from './resources/index.js';
import {
  completeOperation,
  createCancellableOperation,
} from './server/cancellation.js';
import { createProgressReporter } from './server/progress.js';
import { toolDefinitions, toolHandlers, toolInputSchemas } from './tools/index.js';
import { stopAllWatchers } from './tools/watch-folder/index.js';

import type { ToolResult } from './shared/types.js';

const SERVER_NAME = 'runware-mcp';

/** Resolves from src/ in development and dist/ once built; both sit one level under the package root. */
const SERVER_VERSION = z
  .object({ version: z.string() })
  .parse(
    JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is derived from import.meta.url, not input
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    ),
  )
  .version;

const LOG_PREFIX = `[${SERVER_NAME}]`;

// stderr only — stdout carries the MCP protocol stream.
function log(message: string): void {
  process.stderr.write(`${LOG_PREFIX} ${message}\n`);
}

type ToolHandlerFunction = (typeof toolHandlers)[keyof typeof toolHandlers];

// Linear scan rather than dynamic property access: avoids object injection (security/detect-object-injection).
function findToolHandler(name: string): ToolHandlerFunction | undefined {
  for (const [key, handler] of Object.entries(toolHandlers)) {
    if (key === name) {
      return handler;
    }
  }
  return undefined;
}

// Linear scan rather than dynamic property access: avoids object injection (security/detect-object-injection).
function findToolSchema(name: string): (typeof toolInputSchemas)[string] | undefined {
  for (const [key, schema] of Object.entries(toolInputSchemas)) {
    if (key === name) {
      return schema;
    }
  }
  return undefined;
}

type ValidationResult =
  | { success: true; data: unknown }
  | { success: false; errors: string[] };

function validateToolInput(name: string, args: Record<string, unknown>): ValidationResult {
  const schema = findToolSchema(name);
  if (schema === undefined) {
    return { success: true, data: args };
  }

  const result = schema.safeParse(args);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`,
  );
  return { success: false, errors };
}

// Linear scan rather than dynamic property access: avoids object injection.
function findPromptByName(name: string): (typeof PROMPT_TEMPLATES)[string] | undefined {
  for (const [key, template] of Object.entries(PROMPT_TEMPLATES)) {
    if (key === name) {
      return template;
    }
  }
  return undefined;
}

async function main(): Promise<void> {
  // Config is validated at import time by shared/config.ts — a missing RUNWARE_API_KEY has already exited the process.
  log(`Starting server v${SERVER_VERSION}`);

  const client = createRunwareClient();

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
      // Raw MCP arguments bypass Zod defaults, so parsing at the boundary is what applies them.
      const validation = validateToolInput(name, args ?? {});

      if (!validation.success) {
        completeOperation(requestId);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            status: 'error',
            message: `Invalid input for tool "${name}"`,
            validationErrors: validation.errors,
          }) }],
          isError: true,
        };
      }

      const validatedArgs = validation.data;

      const result: ToolResult = await handler(
        validatedArgs as never,
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

  const shutdown = async (): Promise<void> => {
    log('Shutting down...');
    stopAllWatchers();
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });

  process.on('SIGTERM', () => {
    void shutdown();
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log('Server started successfully');
  log(`Tools: ${String(toolDefinitions.length)}`);
  log(`Resources: ${String(RESOURCE_PROVIDERS.length)} providers`);
  log(`Prompts: ${String(Object.keys(PROMPT_TEMPLATES).length)} templates`);
}

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${LOG_PREFIX} Fatal error: ${message}\n`);
  process.exit(1);
});
