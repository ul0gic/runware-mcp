// Does:  Exposes the styleTransfer tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export {
  styleTransfer,
  styleTransferToolDefinition,
} from './handler.js';

export { styleTransferInputSchema } from './schema.js';
