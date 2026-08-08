import { z } from 'zod';

import { folderPathSchema } from '../../shared/validation.js';

export const WATCH_ACTIONS = ['start', 'stop', 'list', 'status'] as const;

export const watchActionSchema = z.enum(WATCH_ACTIONS);

export type WatchAction = z.infer<typeof watchActionSchema>;

export const WATCH_OPERATIONS = [
  'upscale',
  'removeBackground',
  'caption',
  'vectorize',
  'controlNetPreprocess',
] as const;

export const watchOperationSchema = z.enum(WATCH_OPERATIONS);

export type WatchOperation = z.infer<typeof watchOperationSchema>;

export const watchFolderInputSchema = z.object({
  action: watchActionSchema,

  /** Required for 'start'. */
  folderPath: folderPathSchema.optional(),

  /** Required for 'start'. */
  operation: watchOperationSchema.optional(),

  /** Forwarded to the underlying tool for the chosen operation. */
  operationParams: z.record(z.string(), z.unknown()).optional(),

  /** Defaults to writing alongside the input files. */
  outputFolder: folderPathSchema.optional(),

  /** Required for 'stop', optional for 'status'. */
  watcherId: z.uuid().optional(),
}).refine(
  (data) => {
    if (data.action === 'start') {
      return data.folderPath !== undefined && data.operation !== undefined;
    }
    if (data.action === 'stop') {
      return data.watcherId !== undefined;
    }
    return true;
  },
  {
    message: 'start action requires folderPath and operation; stop action requires watcherId',
  },
);

export type WatchFolderInput = z.infer<typeof watchFolderInputSchema>;

export const watcherInfoSchema = z.object({
  id: z.string(),

  folderPath: z.string(),

  operation: z.string(),

  isActive: z.boolean(),

  processedCount: z.number(),

  failedCount: z.number().optional(),

  lastActivity: z.string().optional(),

  outputFolder: z.string().optional(),

  createdAt: z.string().optional(),
});

export type WatcherInfo = z.infer<typeof watcherInfoSchema>;

export const watchFolderOutputSchema = z.object({
  action: z.string(),

  watcherId: z.string().optional(),

  /** Populated by the 'list' action. */
  watchers: z.array(watcherInfoSchema).optional(),

  /** Populated by the 'status' action. */
  watcher: watcherInfoSchema.optional(),

  message: z.string(),
});

export type WatchFolderOutput = z.infer<typeof watchFolderOutputSchema>;
