// Does:  Exposes the runInference tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { runInference, runInferenceToolDefinition } from './handler.js';
export { runInferenceInputSchema } from './schema.js';
