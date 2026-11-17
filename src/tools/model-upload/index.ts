// Does:  Exposes the modelUpload tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { modelUpload, modelUploadToolDefinition } from './handler.js';
export { modelUploadInputSchema } from './schema.js';
