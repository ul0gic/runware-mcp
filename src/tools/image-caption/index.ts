// Does:  Exposes the imageCaption tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  imageCaption,
  imageCaptionToolDefinition,
} from './handler.js';

export { imageCaptionInputSchema } from './schema.js';
