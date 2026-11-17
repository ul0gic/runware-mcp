// Does:  Builds the MCP server and wires tool, resource, and prompt requests to their registries, unconnected.
// Holds: A tool call never throws to the transport: unknown names, invalid input, and handler failures return isError.

import { readFileSync } from 'node:fs';

// Why: The low-level Server API is required; McpServer cannot dispatch through the prebuilt tool invoker registry.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  type CallToolResult,
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { type RunwareClient, createRunwareClient } from '../integrations/runware/client.js';
import { PROMPT_TEMPLATES } from '../prompts/index.js';
import { findProviderForUri, RESOURCE_PROVIDERS } from '../resources/index.js';
import { toolDefinitions, toolInvokers } from '../tools/index.js';

import { createProgressReporter } from './progress.js';
import { recordGeneration } from './record-generation.js';

export const SERVER_NAME = 'runware-mcp';

// Why: Src/server/ and dist/server/ both sit two levels under the package root, so ../../package.json resolves.
export const SERVER_VERSION = z
  .object({ version: z.string() })
  .parse(JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))).version;

// Why: A linear scan over own entries, not obj[name], so a name like __proto__ cannot reach the prototype.
function findOwnEntry<T>(record: Readonly<Record<string, T>>, name: string): T | undefined {
  for (const [key, value] of Object.entries(record)) {
    if (key === name) {
      return value;
    }
  }
  return undefined;
}

function errorContent(payload: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ status: 'error', ...payload }) }],
    isError: true,
  };
}

function registerToolHandlers(server: Server, client: RunwareClient): void {
  server.setRequestHandler(ListToolsRequestSchema, () => Promise.resolve({ tools: [...toolDefinitions] }));

  server.setRequestHandler(CallToolRequestSchema, async (request, extra): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    const invoker = findOwnEntry(toolInvokers, name);
    if (invoker === undefined) {
      return errorContent({ message: `Unknown tool: ${name}` });
    }

    // Why: Raw MCP arguments bypass Zod defaults, so parsing at the boundary is what applies them.
    const invocation = invoker(args ?? {});
    if (!invocation.valid) {
      return errorContent({ message: `Invalid input for tool "${name}"`, validationErrors: invocation.errors });
    }

    // Why: The MCP spec allows progress notifications only for a progressToken the client supplied.
    const progressToken = request.params._meta?.progressToken;
    const progress =
      progressToken === undefined
        ? undefined
        : createProgressReporter(progressToken, (params) => {
            // Why: A progress update lost to a closing transport must not become an unhandled rejection.
            extra.sendNotification({ method: 'notifications/progress', params }).catch(() => undefined);
          });

    try {
      const result = await invocation.run(client, { signal: extra.signal, progress });
      if (result.status === 'success') {
        recordGeneration(name, invocation.input, result.data, result.cost);
      }
      return { content: [{ type: 'text', text: JSON.stringify(result) }], isError: result.status === 'error' };
    } catch (error) {
      return errorContent({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
}

function registerResourceHandlers(server: Server): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const entries = await Promise.all(RESOURCE_PROVIDERS.map((provider) => provider.list()));
    return { resources: entries.flat() };
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
    return { contents: [content] };
  });
}

function registerPromptHandlers(server: Server): void {
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
    const template = findOwnEntry(PROMPT_TEMPLATES, name);
    if (template === undefined) {
      throw new Error(`Unknown prompt template: ${name}`);
    }
    return Promise.resolve({
      messages: template.generate(args ?? {}).map((msg) => ({
        role: msg.role,
        content: { type: 'text' as const, text: msg.content },
      })),
    });
  });
}

export function createServer(client: RunwareClient = createRunwareClient()): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );
  registerToolHandlers(server, client);
  registerResourceHandlers(server);
  registerPromptHandlers(server);
  return server;
}
