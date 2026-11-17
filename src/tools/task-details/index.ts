// Does:  Exposes the getTaskDetails tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { getTaskDetails, getTaskDetailsToolDefinition } from './handler.js';
export { getTaskDetailsInputSchema } from './schema.js';
