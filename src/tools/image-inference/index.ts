// Does:  Exposes the imageInference tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  imageInference,
  imageInferenceToolDefinition,
} from './handler.js';

export { imageInferenceInputSchema } from './schema.js';
