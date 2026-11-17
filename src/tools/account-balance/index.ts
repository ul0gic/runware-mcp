// Does:  Exposes the accountBalance tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { accountBalance, accountBalanceToolDefinition } from './handler.js';

export { accountBalanceInputSchema } from './schema.js';
