// Does:  Exposes the vectorize tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { vectorize, vectorizeToolDefinition } from './handler.js';

export { vectorizeInputSchema } from './schema.js';
