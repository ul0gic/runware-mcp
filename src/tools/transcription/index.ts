// Does:  Exposes the transcription tool to the registry in src/tools/index.ts.
// Holds: Only the handler, its MCP definition and the input schema leave this directory; helpers stay internal.

export { transcription, transcriptionToolDefinition } from './handler.js';

export { transcriptionInputSchema } from './schema.js';
