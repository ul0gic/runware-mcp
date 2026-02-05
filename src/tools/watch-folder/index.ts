/**
 * Watch folder tool barrel export.
 */

export {
  watchFolder,
  watchFolderToolDefinition,
  stopAllWatchers,
  getActiveWatcherCount,
} from './handler.js';

export {
  watchFolderInputSchema,
  watchFolderOutputSchema,
  watcherInfoSchema,
  watchActionSchema,
  watchOperationSchema,
  WATCH_ACTIONS,
  WATCH_OPERATIONS,
  type WatchFolderInput,
  type WatchFolderOutput,
  type WatcherInfo,
  type WatchAction,
  type WatchOperation,
} from './schema.js';
