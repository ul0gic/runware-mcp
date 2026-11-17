// Does:  Exposes the processFolder tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  processFolder,
  processFolderToolDefinition,
} from './handler.js';

export { processFolderInputSchema } from './schema.js';
