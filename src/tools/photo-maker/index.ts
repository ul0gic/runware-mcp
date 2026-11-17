// Does:  Exposes the photoMaker tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  photoMaker,
  photoMakerToolDefinition,
} from './handler.js';

export { photoMakerInputSchema } from './schema.js';
