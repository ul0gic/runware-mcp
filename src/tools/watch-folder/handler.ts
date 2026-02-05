/**
 * Handler for the watch folder tool.
 *
 * Manages folder watchers that auto-process new image files.
 * Watchers use fs.watch with debouncing to handle rapid file changes.
 *
 * NOTE: Watchers are in-memory and do not persist across server restarts.
 * The database stores watcher configuration for potential future persistence.
 */

import { watch, type FSWatcher } from 'node:fs';
import path from 'node:path';

import {
  addWatchedFolder,
  getWatchedFolder,
  getWatchedFolders,
  removeWatchedFolder,
  updateWatchedFolder,
} from '../../database/operations.js';
import {
  type RunwareClient,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { config } from '../../shared/config.js';
import { wrapError } from '../../shared/errors.js';
import { readFileAsBase64 } from '../../shared/file-utils.js';
import {
  IMAGE_EXTENSIONS,
  validateFolder,
} from '../../shared/folder-utils.js';
import {
  type ToolContext,
  type ToolResult,
  errorResult,
  successResult,
} from '../../shared/types.js';
import { debounce, generateTaskUUID } from '../../shared/utils.js';
import { controlNetPreprocess } from '../controlnet-preprocess/index.js';
import { imageBackgroundRemoval } from '../image-background-removal/index.js';
import { imageCaption } from '../image-caption/index.js';
import { imageUpscale } from '../image-upscale/index.js';
import { vectorize } from '../vectorize/index.js';

import type {
  WatcherInfo,
  WatchFolderOutput,
  WatchOperation,
  watchFolderInputSchema,
} from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

/**
 * Input type for watch folder.
 */
type WatchFolderInputType = z.infer<typeof watchFolderInputSchema>;

/**
 * Internal watcher state.
 */
interface WatcherState {
  readonly id: string;
  readonly folderPath: string;
  readonly operation: WatchOperation;
  readonly operationParams: Record<string, unknown>;
  readonly outputFolder: string | undefined;
  readonly watcher: FSWatcher;
  processedCount: number;
  failedCount: number;
  lastActivity: Date | undefined;
  readonly createdAt: Date;
}

// ============================================================================
// In-Memory Watcher Registry
// ============================================================================

/**
 * Map of active watchers by ID.
 * Watchers are in-memory only and do not persist across restarts.
 */
const activeWatchers = new Map<string, WatcherState>();

// ============================================================================
// File Processing
// ============================================================================

/**
 * Checks if a filename is an image file.
 */
function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Gets the file extension for MIME type detection.
 */
function getExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  switch (ext) {
    case 'jpg':
    case 'jpeg': {
      return 'jpeg';
    }
    case 'png': {
      return 'png';
    }
    case 'webp': {
      return 'webp';
    }
    case 'gif': {
      return 'gif';
    }
    case 'bmp': {
      return 'bmp';
    }
    default: {
      return 'jpeg';
    }
  }
}

// ============================================================================
// Operation Parameters
// ============================================================================

/**
 * Operation parameters interface for type-safe access.
 */
interface WatchOperationParams {
  readonly model?: string;
  readonly upscaleFactor?: 2 | 4;
  readonly preprocessor?: string;
}

/**
 * Safely extracts a value from params by iterating over entries.
 */
function getParamValue(params: Record<string, unknown>, targetKey: string): unknown {
  for (const [key, value] of Object.entries(params)) {
    if (key === targetKey) {
      return value;
    }
  }
  return undefined;
}

/**
 * Gets a string value from params safely.
 */
function getStringParam(params: Record<string, unknown>, key: string): string | undefined {
  const value = getParamValue(params, key);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Gets the upscale factor from params safely.
 */
function getUpscaleFactorParam(params: Record<string, unknown>): 2 | 4 | undefined {
  const value = getParamValue(params, 'upscaleFactor');
  if (value === 2 || value === 4) {
    return value;
  }
  return undefined;
}

/**
 * Safely extracts operation params from unknown record.
 */
function extractWatchOperationParams(params: Record<string, unknown>): WatchOperationParams {
  return {
    model: getStringParam(params, 'model'),
    upscaleFactor: getUpscaleFactorParam(params),
    preprocessor: getStringParam(params, 'preprocessor'),
  };
}

/**
 * Processes a single file using the configured operation.
 */
async function processFile(
  filePath: string,
  operation: WatchOperation,
  operationParams: Record<string, unknown>,
  client: RunwareClient,
): Promise<boolean> {
  try {
    // Read and encode the image
    const imageBase64 = await readFileAsBase64(filePath);
    const imageData = `data:image/${getExtension(filePath)};base64,${imageBase64}`;

    // Extract params safely
    const params = extractWatchOperationParams(operationParams);

    // Execute the operation
    let result: ToolResult;

    switch (operation) {
      case 'upscale': {
        result = await imageUpscale(
          {
            inputImage: imageData,
            upscaleFactor: params.upscaleFactor ?? 2,
            model: params.model,
            outputType: 'URL',
            includeCost: true,
          },
          client,
        );
        break;
      }

      case 'removeBackground': {
        const bgModel = params.model;
        result = await imageBackgroundRemoval(
          {
            inputImage: imageData,
            model: bgModel !== undefined && bgModel.length > 0 ? bgModel : 'runware:109@1',
            outputType: 'URL',
            includeCost: true,
          },
          client,
        );
        break;
      }

      case 'caption': {
        const captionModel = params.model;
        result = await imageCaption(
          {
            inputImage: imageData,
            model: captionModel !== undefined && captionModel.length > 0 ? captionModel : 'runware:150@2',
            includeCost: true,
          },
          client,
        );
        break;
      }

      case 'vectorize': {
        const vecModel = params.model;
        const validVecModel = vecModel === 'recraft:1@1' || vecModel === 'picsart:1@1' ? vecModel : 'recraft:1@1';
        result = await vectorize(
          {
            inputImage: imageData,
            model: validVecModel,
            outputFormat: 'SVG',
            includeCost: true,
          },
          client,
        );
        break;
      }

      case 'controlNetPreprocess': {
        const preprocessor = params.preprocessor;
        if (preprocessor === undefined) {
          return false;
        }
        const validPreprocessors = [
          'canny', 'depth', 'mlsd', 'normalbae', 'openpose', 'tile',
          'seg', 'lineart', 'lineart_anime', 'shuffle', 'scribble', 'softedge',
        ] as const;
        if (!validPreprocessors.includes(preprocessor as typeof validPreprocessors[number])) {
          return false;
        }
        result = await controlNetPreprocess(
          {
            inputImage: imageData,
            preprocessor: preprocessor as typeof validPreprocessors[number],
            includeCost: true,
          },
          client,
        );
        break;
      }
    }

    return result.status === 'success';
  } catch {
    return false;
  }
}

/**
 * Processes a file asynchronously and updates state.
 */
async function processFileAndUpdateState(
  filePath: string,
  state: WatcherState,
  client: RunwareClient,
  processingFiles: Set<string>,
): Promise<void> {
  // Skip if already processing
  if (processingFiles.has(filePath)) {
    return;
  }

  processingFiles.add(filePath);

  try {
    const success = await processFile(
      filePath,
      state.operation,
      state.operationParams,
      client,
    );

    if (success) {
      state.processedCount += 1;
    } else {
      state.failedCount += 1;
    }

    state.lastActivity = new Date();
  } finally {
    processingFiles.delete(filePath);
  }
}

/**
 * Creates a file change handler for a watcher.
 */
function createFileHandler(
  state: WatcherState,
  client: RunwareClient,
): (eventType: string, filename: string | null) => void {
  // Track files being processed to avoid duplicates
  const processingFiles = new Set<string>();

  // Create debounced handler that wraps the async processing
  const debouncedHandler = debounce(
    (filePath: string): void => {
      // Fire and forget the async processing
      processFileAndUpdateState(filePath, state, client, processingFiles).catch(() => {
        // Errors are handled inside processFileAndUpdateState
      });
    },
    config.WATCH_DEBOUNCE_MS,
  );

  return (eventType: string, filename: string | null): void => {
    // Only process 'rename' events (new files) with valid image filenames
    if (eventType === 'rename' && filename !== null && isImageFile(filename)) {
      const filePath = path.join(state.folderPath, filename);
      debouncedHandler(filePath);
    }
  };
}

// ============================================================================
// Action Handlers
// ============================================================================

/**
 * Starts watching a folder.
 */
async function handleStart(
  input: WatchFolderInputType,
  client: RunwareClient,
): Promise<WatchFolderOutput> {
  // Validate required fields (Zod refinement ensures these exist for 'start' action)
  const inputFolderPath = input.folderPath;
  const inputOperation = input.operation;

  if (inputFolderPath === undefined || inputOperation === undefined) {
    return {
      action: 'start',
      message: 'start action requires folderPath and operation',
    };
  }

  // Validate folder path
  const folderPath = await validateFolder(inputFolderPath);

  // Check if already watching this folder
  for (const [id, watcher] of activeWatchers.entries()) {
    if (watcher.folderPath === folderPath) {
      return {
        action: 'start',
        watcherId: id,
        message: `Already watching folder: ${folderPath}`,
      };
    }
  }

  // Validate output folder if specified
  if (input.outputFolder !== undefined) {
    await validateFolder(input.outputFolder);
  }

  // Generate watcher ID
  const watcherId = generateTaskUUID();

  // Save to database
  addWatchedFolder({
    path: folderPath,
    operation: inputOperation,
    operationParams: JSON.stringify(input.operationParams ?? {}),
    outputFolder: input.outputFolder ?? null,
    isActive: true,
    lastScan: null,
  });

  // Create watcher state
  const state: WatcherState = {
    id: watcherId,
    folderPath,
    operation: inputOperation,
    operationParams: input.operationParams ?? {},
    outputFolder: input.outputFolder,
    watcher: undefined as unknown as FSWatcher, // Will be set below
    processedCount: 0,
    failedCount: 0,
    lastActivity: undefined,
    createdAt: new Date(),
  };

  // Create the file system watcher
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path validated above
  const fsWatcher = watch(
    folderPath,
    { persistent: false },
    createFileHandler(state, client),
  );

  // Update state with actual watcher
  (state as { watcher: FSWatcher }).watcher = fsWatcher;

  // Register watcher
  activeWatchers.set(watcherId, state);

  return {
    action: 'start',
    watcherId,
    message: `Started watching folder: ${folderPath} (operation: ${inputOperation})`,
  };
}

/**
 * Stops watching a folder.
 */
function handleStop(input: WatchFolderInputType): WatchFolderOutput {
  const inputWatcherId = input.watcherId;

  if (inputWatcherId === undefined) {
    return {
      action: 'stop',
      message: 'stop action requires watcherId',
    };
  }

  const watcherId = inputWatcherId;
  const state = activeWatchers.get(watcherId);

  if (state === undefined) {
    return {
      action: 'stop',
      watcherId,
      message: `Watcher not found: ${watcherId}`,
    };
  }

  // Close the file system watcher
  state.watcher.close();

  // Remove from registry
  activeWatchers.delete(watcherId);

  // Update database
  removeWatchedFolder(watcherId);

  return {
    action: 'stop',
    watcherId,
    message: `Stopped watching folder: ${state.folderPath}`,
  };
}

/**
 * Lists all active watchers.
 */
function handleList(): WatchFolderOutput {
  const watchers: WatcherInfo[] = [];

  for (const [id, state] of activeWatchers.entries()) {
    watchers.push({
      id,
      folderPath: state.folderPath,
      operation: state.operation,
      isActive: true,
      processedCount: state.processedCount,
      failedCount: state.failedCount,
      lastActivity: state.lastActivity?.toISOString(),
      outputFolder: state.outputFolder,
      createdAt: state.createdAt.toISOString(),
    });
  }

  // Also include inactive watchers from database
  const dbWatchers = getWatchedFolders();
  for (const dbWatcher of dbWatchers) {
    // Skip if already in active list
    if (activeWatchers.has(dbWatcher.id)) {
      continue;
    }

    watchers.push({
      id: dbWatcher.id,
      folderPath: dbWatcher.path,
      operation: dbWatcher.operation,
      isActive: false,
      processedCount: 0,
      outputFolder: dbWatcher.outputFolder ?? undefined,
      createdAt: dbWatcher.createdAt.toISOString(),
    });
  }

  return {
    action: 'list',
    watchers,
    message: `Found ${String(watchers.length)} watcher(s)`,
  };
}

/**
 * Gets status of a specific watcher.
 */
function handleStatus(input: WatchFolderInputType): WatchFolderOutput {
  const watcherId = input.watcherId;

  // Check in-memory first
  if (watcherId !== undefined) {
    const state = activeWatchers.get(watcherId);
    if (state !== undefined) {
      return {
        action: 'status',
        watcherId,
        watcher: {
          id: state.id,
          folderPath: state.folderPath,
          operation: state.operation,
          isActive: true,
          processedCount: state.processedCount,
          failedCount: state.failedCount,
          lastActivity: state.lastActivity?.toISOString(),
          outputFolder: state.outputFolder,
          createdAt: state.createdAt.toISOString(),
        },
        message: `Watcher ${watcherId} is active`,
      };
    }

    // Check database
    const dbWatcher = getWatchedFolder(watcherId);
    if (dbWatcher !== null) {
      return {
        action: 'status',
        watcherId,
        watcher: {
          id: dbWatcher.id,
          folderPath: dbWatcher.path,
          operation: dbWatcher.operation,
          isActive: false,
          processedCount: 0,
          outputFolder: dbWatcher.outputFolder ?? undefined,
          createdAt: dbWatcher.createdAt.toISOString(),
        },
        message: `Watcher ${watcherId} exists but is not active`,
      };
    }

    return {
      action: 'status',
      watcherId,
      message: `Watcher not found: ${watcherId}`,
    };
  }

  // Return overall status if no ID specified
  const activeCount = activeWatchers.size;
  return {
    action: 'status',
    message: `${String(activeCount)} active watcher(s)`,
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Manages folder watchers for auto-processing new files.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client (uses default if not provided)
 * @param context - Optional tool context for progress and cancellation
 * @returns Tool result with watcher status
 */
export async function watchFolder(
  input: WatchFolderInputType,
  client?: RunwareClient,
  _context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    let output: WatchFolderOutput;

    switch (input.action) {
      case 'start': {
        output = await handleStart(input, runwareClient);
        break;
      }

      case 'stop': {
        output = handleStop(input);
        break;
      }

      case 'list': {
        output = handleList();
        break;
      }

      case 'status': {
        output = handleStatus(input);
        break;
      }
    }

    return successResult(output.message, output);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

/**
 * Stops all active watchers.
 * Should be called during server shutdown.
 */
export function stopAllWatchers(): void {
  for (const [id, state] of activeWatchers.entries()) {
    state.watcher.close();
    updateWatchedFolder(id, { isActive: false });
  }
  activeWatchers.clear();
}

/**
 * Gets the count of active watchers.
 */
export function getActiveWatcherCount(): number {
  return activeWatchers.size;
}

/**
 * MCP tool definition for watch folder.
 */
export const watchFolderToolDefinition = {
  name: 'watchFolder',
  description: 'Manage folder watchers that auto-process new image files. Actions: start (begin watching), stop (end watching), list (show all watchers), status (check a watcher).',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['start', 'stop', 'list', 'status'],
        description: 'Action to perform on the watcher',
      },
      folderPath: {
        type: 'string',
        description: 'Folder path to watch (required for start action)',
      },
      operation: {
        type: 'string',
        enum: ['upscale', 'removeBackground', 'caption', 'vectorize', 'controlNetPreprocess'],
        description: 'Operation to perform on new files (required for start action)',
      },
      operationParams: {
        type: 'object',
        description: 'Operation-specific parameters',
      },
      outputFolder: {
        type: 'string',
        description: 'Output folder for processed files (optional)',
      },
      watcherId: {
        type: 'string',
        description: 'Watcher ID (required for stop action, optional for status)',
      },
    },
    required: ['action'],
  },
} as const;
