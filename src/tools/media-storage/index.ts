// Does:  Exposes the mediaStorage tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { mediaStorage, mediaStorageToolDefinition } from './handler.js';
export { mediaStorageInputSchema } from './schema.js';
