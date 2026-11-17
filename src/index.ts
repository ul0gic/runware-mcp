#!/usr/bin/env node
// Does:  Starts the MCP server over stdio and shuts it down cleanly on SIGINT or SIGTERM.
// Holds: Nothing but the MCP protocol stream is written to stdout; all logging goes to stderr.

import process from 'node:process';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { PROMPT_TEMPLATES } from './prompts/index.js';
import { RESOURCE_PROVIDERS } from './resources/index.js';
import { SERVER_NAME, SERVER_VERSION, createServer } from './server/create-server.js';
import { toolDefinitions } from './tools/index.js';
import { stopAllWatchers } from './tools/watch-folder/index.js';

const LOG_PREFIX = `[${SERVER_NAME}]`;

// Why: Stdout carries the MCP protocol stream; any other write there corrupts the session.
function log(message: string): void {
  process.stderr.write(`${LOG_PREFIX} ${message}\n`);
}

async function main(): Promise<void> {
  log(`Starting server v${SERVER_VERSION}`);

  const server = createServer();

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

  await server.connect(new StdioServerTransport());

  log('Server started successfully');
  log(`Tools: ${String(toolDefinitions.length)}`);
  log(`Resources: ${String(RESOURCE_PROVIDERS.length)} providers`);
  log(`Prompts: ${String(Object.keys(PROMPT_TEMPLATES).length)} templates`);
}

try {
  await main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${LOG_PREFIX} Fatal error: ${message}\n`);
  process.exit(1);
}
