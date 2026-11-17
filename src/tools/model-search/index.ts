// Does:  Exposes the modelSearch tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  modelSearch,
  modelSearchToolDefinition,
} from './handler.js';

export { modelSearchInputSchema } from './schema.js';
