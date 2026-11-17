// Does:  Exposes the textInference tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { textInference, textInferenceToolDefinition } from './handler.js';
export { textInferenceInputSchema } from './schema.js';
