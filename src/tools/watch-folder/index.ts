// Does:  Exposes the watchFolder tool and the shutdown hook that stops every watcher.
// Holds: Only the handler, its MCP definition, stopAllWatchers and the input schema leave this directory.

export {
  watchFolder,
  watchFolderToolDefinition,
  stopAllWatchers,
} from './handler.js';

export { watchFolderInputSchema } from './schema.js';
