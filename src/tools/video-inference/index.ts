// Does:  Exposes the videoInference tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  videoInference,
  videoInferenceToolDefinition,
} from './handler.js';

export { videoInferenceInputSchema } from './schema.js';
