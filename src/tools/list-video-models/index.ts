// Does:  Exposes the listVideoModels tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  listVideoModels,
  listVideoModelsToolDefinition,
} from './handler.js';

export { listVideoModelsInputSchema } from './schema.js';
