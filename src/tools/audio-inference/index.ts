// Does:  Exposes the audioInference tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { audioInference, audioInferenceToolDefinition } from './handler.js';

export { audioInferenceInputSchema } from './schema.js';
