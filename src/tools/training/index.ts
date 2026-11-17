// Does:  Exposes the training tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { training, trainingToolDefinition } from './handler.js';
export { trainingInputSchema } from './schema.js';
