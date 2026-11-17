// Does:  Exposes the imageUpload tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  imageUpload,
  imageUploadToolDefinition,
} from './handler.js';

export { imageUploadInputSchema } from './schema.js';
