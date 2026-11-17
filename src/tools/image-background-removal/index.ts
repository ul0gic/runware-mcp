// Does:  Exposes the imageBackgroundRemoval tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  imageBackgroundRemoval,
  imageBackgroundRemovalToolDefinition,
} from './handler.js';

export { imageBackgroundRemovalInputSchema } from './schema.js';
