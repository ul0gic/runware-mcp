// Does:  Exposes the batchImageInference tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  batchImageInference,
  batchImageInferenceToolDefinition,
} from './handler.js';

export { batchImageInferenceInputSchema } from './schema.js';
