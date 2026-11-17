// Does:  Exposes the threeDInference tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { threeDInference, threeDInferenceToolDefinition } from './handler.js';
export { threeDInferenceInputSchema } from './schema.js';
