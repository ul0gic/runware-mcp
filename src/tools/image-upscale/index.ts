// Does:  Exposes the imageUpscale tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  imageUpscale,
  imageUpscaleToolDefinition,
} from './handler.js';

export { imageUpscaleInputSchema } from './schema.js';
