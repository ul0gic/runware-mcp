// Does:  Exposes the accountManagement tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { accountManagement, accountManagementToolDefinition } from './handler.js';
export { accountManagementInputSchema } from './schema.js';
