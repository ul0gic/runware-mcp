// Does:  Starts, stops and reports fs watchers that run an image operation on each new image file.
// Holds: Watchers live only in this process's memory; at most one watcher exists per resolved folder path.

import { watch, type FSWatcher } from 'node:fs';
import path from 'node:path';

import { type RunwareClient, getDefaultClient } from '../../integrations/runware/client.js';
import { config } from '../../shared/config.js';
import { wrapError } from '../../shared/errors.js';
import { readFileAsBase64 } from '../../shared/file-utils.js';
import { IMAGE_EXTENSIONS, validateFolder } from '../../shared/folder-utils.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';
import { debounce, generateTaskUUID } from '../../shared/utils.js';
import { controlNetPreprocess } from '../controlnet-preprocess/index.js';
import { imageBackgroundRemoval } from '../image-background-removal/index.js';
import { imageCaption } from '../image-caption/index.js';
import { imageUpscale } from '../image-upscale/index.js';
import { vectorize } from '../vectorize/index.js';

import type { WatcherInfo, WatchFolderOutput, WatchOperation, watchFolderInputSchema } from './schema.js';
import type { z } from 'zod';

type WatchFolderInputType = z.infer<typeof watchFolderInputSchema>;

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

const activeWatchers = new Map<string, WatcherState>();

type WatcherRuntime = Omit<WatcherState, 'watcher'>;

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

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

interface WatchOperationParams {
  readonly model?: string | undefined;
  readonly upscaleFactor?: 2 | 4 | undefined;
  readonly preprocessor?: string | undefined;
}

// Why: Iterating entries avoids indexing an untrusted record by a dynamic key.
function getParamValue(params: Record<string, unknown>, targetKey: string): unknown {
  for (const [key, value] of Object.entries(params)) {
    if (key === targetKey) {
      return value;
    }
  }
  return undefined;
}

function getStringParam(params: Record<string, unknown>, key: string): string | undefined {
  const value = getParamValue(params, key);
  return typeof value === 'string' ? value : undefined;
}

function getUpscaleFactorParam(params: Record<string, unknown>): 2 | 4 | undefined {
  const value = getParamValue(params, 'upscaleFactor');
  return value === 2 || value === 4 ? value : undefined;
}

function extractWatchOperationParams(params: Record<string, unknown>): WatchOperationParams {
  return {
    model: getStringParam(params, 'model'),
    upscaleFactor: getUpscaleFactorParam(params),
    preprocessor: getStringParam(params, 'preprocessor'),
  };
}

const WATCH_PREPROCESSORS = [
  'canny',
  'depth',
  'mlsd',
  'normalbae',
  'openpose',
  'tile',
  'seg',
  'lineart',
  'lineart_anime',
  'shuffle',
  'scribble',
  'softedge',
] as const;

type WatchPreprocessor = (typeof WATCH_PREPROCESSORS)[number];

function isWatchPreprocessor(value: string): value is WatchPreprocessor {
  return WATCH_PREPROCESSORS.some((known) => known === value);
}

function modelOrDefault(model: string | undefined, fallback: string): string {
  return model !== undefined && model.length > 0 ? model : fallback;
}

function runWatchOperation(
  operation: WatchOperation,
  imageData: string,
  params: WatchOperationParams,
  client: RunwareClient,
): Promise<ToolResult> | undefined {
  switch (operation) {
    case 'upscale': {
      return imageUpscale(
        {
          inputImage: imageData,
          upscaleFactor: params.upscaleFactor ?? 2,
          model: params.model,
          outputType: 'URL',
          includeCost: true,
        },
        client,
      );
    }
    case 'removeBackground': {
      return imageBackgroundRemoval(
        {
          inputImage: imageData,
          model: modelOrDefault(params.model, 'runware:109@1'),
          outputType: 'URL',
          includeCost: true,
        },
        client,
      );
    }
    case 'caption': {
      return imageCaption(
        { inputImage: imageData, model: modelOrDefault(params.model, 'runware:150@2'), includeCost: true },
        client,
      );
    }
    case 'vectorize': {
      const model = params.model === 'recraft:1@1' || params.model === 'picsart:1@1' ? params.model : 'recraft:1@1';
      return vectorize({ inputImage: imageData, model, outputFormat: 'SVG', includeCost: true }, client);
    }
    case 'controlNetPreprocess': {
      const preprocessor = params.preprocessor;
      if (preprocessor === undefined || !isWatchPreprocessor(preprocessor)) {
        return undefined;
      }
      return controlNetPreprocess({ inputImage: imageData, preprocessor, includeCost: true }, client);
    }
  }
}

async function processFile(
  filePath: string,
  operation: WatchOperation,
  operationParams: Record<string, unknown>,
  client: RunwareClient,
): Promise<boolean> {
  try {
    const imageBase64 = await readFileAsBase64(filePath);
    const imageData = `data:image/${getExtension(filePath)};base64,${imageBase64}`;
    const pending = runWatchOperation(operation, imageData, extractWatchOperationParams(operationParams), client);
    if (pending === undefined) {
      return false;
    }
    const result = await pending;
    return result.status === 'success';
  } catch {
    return false;
  }
}

async function processFileAndUpdateState(
  filePath: string,
  state: WatcherRuntime,
  client: RunwareClient,
  processingFiles: Set<string>,
): Promise<void> {
  if (processingFiles.has(filePath)) {
    return;
  }

  processingFiles.add(filePath);

  try {
    const success = await processFile(filePath, state.operation, state.operationParams, client);

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

function createFileHandler(
  state: WatcherRuntime,
  client: RunwareClient,
): (eventType: string, filename: string | null) => void {
  // Why: Fs.watch can fire repeatedly for one file, so in-flight paths are tracked to process each once.
  const processingFiles = new Set<string>();

  const debouncedHandler = debounce((filePath: string): void => {
    void processFileAndUpdateState(filePath, state, client, processingFiles);
  }, config.WATCH_DEBOUNCE_MS);

  return (eventType: string, filename: string | null): void => {
    // Why: Fs.watch surfaces newly created files as 'rename' events, not 'change'.
    if (!(eventType === 'rename' && filename !== null && isImageFile(filename))) {
      return;
    }

    const filePath = path.join(state.folderPath, filename);
    debouncedHandler(filePath);
  };
}

async function handleStart(input: WatchFolderInputType, client: RunwareClient): Promise<WatchFolderOutput> {
  const inputFolderPath = input.folderPath;
  const inputOperation = input.operation;

  if (inputFolderPath === undefined || inputOperation === undefined) {
    return {
      action: 'start',
      message: 'start action requires folderPath and operation',
    };
  }

  const folderPath = await validateFolder(inputFolderPath);

  for (const [id, watcher] of activeWatchers) {
    if (watcher.folderPath === folderPath) {
      return {
        action: 'start',
        watcherId: id,
        message: `Already watching folder: ${folderPath}`,
      };
    }
  }

  if (input.outputFolder !== undefined) {
    await validateFolder(input.outputFolder);
  }

  const watcherId = generateTaskUUID();

  const runtime: WatcherRuntime = {
    id: watcherId,
    folderPath,
    operation: inputOperation,
    operationParams: input.operationParams ?? {},
    outputFolder: input.outputFolder,
    processedCount: 0,
    failedCount: 0,
    lastActivity: undefined,
    createdAt: new Date(),
  };

  const fsWatcher = watch(folderPath, { persistent: false }, createFileHandler(runtime, client));

  // Why: The file handler holds runtime by reference, so the watcher joins that object to keep counters live.
  activeWatchers.set(watcherId, Object.assign(runtime, { watcher: fsWatcher }));

  return {
    action: 'start',
    watcherId,
    message: `Started watching folder: ${folderPath} (operation: ${inputOperation})`,
  };
}

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

  state.watcher.close();
  activeWatchers.delete(watcherId);

  return {
    action: 'stop',
    watcherId,
    message: `Stopped watching folder: ${state.folderPath}`,
  };
}

function handleList(): WatchFolderOutput {
  const watchers: WatcherInfo[] = Array.from(activeWatchers, ([id, state]) => ({
    id,
    folderPath: state.folderPath,
    operation: state.operation,
    isActive: true,
    processedCount: state.processedCount,
    failedCount: state.failedCount,
    lastActivity: state.lastActivity?.toISOString(),
    outputFolder: state.outputFolder,
    createdAt: state.createdAt.toISOString(),
  }));

  return {
    action: 'list',
    watchers,
    message: `Found ${String(watchers.length)} watcher(s)`,
  };
}

function handleStatus(input: WatchFolderInputType): WatchFolderOutput {
  const watcherId = input.watcherId;

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

    return {
      action: 'status',
      watcherId,
      message: `Watcher not found: ${watcherId}`,
    };
  }

  const activeCount = activeWatchers.size;
  return {
    action: 'status',
    message: `${String(activeCount)} active watcher(s)`,
  };
}

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

// Holds: The server's shutdown path calls this; nothing else closes the fs handles.
export function stopAllWatchers(): void {
  for (const [, state] of activeWatchers) {
    state.watcher.close();
  }
  activeWatchers.clear();
}

export const watchFolderToolDefinition = {
  name: 'watchFolder',
  description:
    'Manage folder watchers that auto-process new image files. Actions: start (begin watching), stop (end watching), list (show all watchers), status (check a watcher).',
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
