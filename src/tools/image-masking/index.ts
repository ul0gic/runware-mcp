// Does:  Exposes the imageMasking tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  imageMasking,
  imageMaskingToolDefinition,
} from './handler.js';

export { imageMaskingInputSchema } from './schema.js';
