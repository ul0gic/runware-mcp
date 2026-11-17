// Does:  Exposes the promptEnhance tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { promptEnhance, promptEnhanceToolDefinition } from './handler.js';

export { promptEnhanceInputSchema } from './schema.js';
