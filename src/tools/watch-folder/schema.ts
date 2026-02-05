/**
 * Schema definitions for the watch folder tool.
 *
 * Manages folder watchers that auto-process new image files.
 * Supports starting, stopping, listing, and checking status of watchers.
 */

import { z } from 'zod';

import { folderPathSchema } from '../../shared/validation.js';

// ============================================================================
// Watch Actions
// ============================================================================

/**
 * Available actions for folder watching.
 */
export const WATCH_ACTIONS = ['start', 'stop', 'list', 'status'] as const;

/**
 * Schema for watch action type.
 */
export const watchActionSchema = z.enum(WATCH_ACTIONS);

/**
 * Type for watch action values.
 */
export type WatchAction = z.infer<typeof watchActionSchema>;

// ============================================================================
// Watch Operations
// ============================================================================

/**
 * Operations that can be performed on new files.
 */
export const WATCH_OPERATIONS = [
  'upscale',
  'removeBackground',
  'caption',
  'vectorize',
  'controlNetPreprocess',
] as const;

/**
 * Schema for watch operation type.
 */
export const watchOperationSchema = z.enum(WATCH_OPERATIONS);

/**
 * Type for watch operation values.
 */
export type WatchOperation = z.infer<typeof watchOperationSchema>;

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for watch folder input.
 */
export const watchFolderInputSchema = z.object({
  /**
   * Action to perform.
   * - start: Begin watching a folder
   * - stop: Stop watching a folder
   * - list: List all active watchers
   * - status: Get status of a specific watcher
   */
  action: watchActionSchema,

  /**
   * Path to the folder to watch.
   * Required for 'start' action.
   */
  folderPath: folderPathSchema.optional(),

  /**
   * Operation to perform on new files.
   * Required for 'start' action.
   */
  operation: watchOperationSchema.optional(),

  /**
   * Operation-specific parameters passed to the underlying tool.
   */
  operationParams: z.record(z.string(), z.unknown()).optional(),

  /**
   * Output folder for processed files.
   * If not specified, outputs alongside input files.
   */
  outputFolder: folderPathSchema.optional(),

  /**
   * Watcher ID for 'stop' or 'status' actions.
   */
  watcherId: z.uuid().optional(),
}).refine(
  (data) => {
    // Validate required fields for 'start' action
    if (data.action === 'start') {
      return data.folderPath !== undefined && data.operation !== undefined;
    }
    // Validate required fields for 'stop' action
    if (data.action === 'stop') {
      return data.watcherId !== undefined;
    }
    return true;
  },
  {
    message: 'start action requires folderPath and operation; stop action requires watcherId',
  },
);

/**
 * Type for validated watch folder input.
 */
export type WatchFolderInput = z.infer<typeof watchFolderInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for watcher info in output.
 */
export const watcherInfoSchema = z.object({
  /**
   * Unique watcher ID.
   */
  id: z.string(),

  /**
   * Path being watched.
   */
  folderPath: z.string(),

  /**
   * Operation performed on new files.
   */
  operation: z.string(),

  /**
   * Whether the watcher is currently active.
   */
  isActive: z.boolean(),

  /**
   * Number of files processed by this watcher.
   */
  processedCount: z.number(),

  /**
   * Number of files that failed processing.
   */
  failedCount: z.number().optional(),

  /**
   * Timestamp of last activity.
   */
  lastActivity: z.string().optional(),

  /**
   * Output folder for processed files.
   */
  outputFolder: z.string().optional(),

  /**
   * Timestamp when watcher was created.
   */
  createdAt: z.string().optional(),
});

/**
 * Type for watcher info.
 */
export type WatcherInfo = z.infer<typeof watcherInfoSchema>;

/**
 * Schema for watch folder output.
 */
export const watchFolderOutputSchema = z.object({
  /**
   * Action that was performed.
   */
  action: z.string(),

  /**
   * Watcher ID (for start, stop, status actions).
   */
  watcherId: z.string().optional(),

  /**
   * List of watchers (for list action).
   */
  watchers: z.array(watcherInfoSchema).optional(),

  /**
   * Single watcher info (for status action).
   */
  watcher: watcherInfoSchema.optional(),

  /**
   * Status message.
   */
  message: z.string(),
});

/**
 * Type for watch folder output.
 */
export type WatchFolderOutput = z.infer<typeof watchFolderOutputSchema>;
