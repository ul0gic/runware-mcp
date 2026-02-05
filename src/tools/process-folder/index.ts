/**
 * Process folder tool barrel export.
 */

export {
  processFolder,
  processFolderToolDefinition,
} from './handler.js';

export {
  processFolderInputSchema,
  processFolderOutputSchema,
  fileResultSchema,
  folderOperationSchema,
  FOLDER_OPERATIONS,
  type ProcessFolderInput,
  type ProcessFolderOutput,
  type FileResult,
  type FolderOperation,
} from './schema.js';
