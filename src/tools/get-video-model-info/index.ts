// Does:  Exposes the getVideoModelInfo tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  getVideoModelInfo,
  getVideoModelInfoToolDefinition,
} from './handler.js';

export { getVideoModelInfoInputSchema } from './schema.js';
