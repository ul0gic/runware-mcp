// Does:  Validates watchFolder actions and describes watcher status output.
// Holds: Start is refused without folderPath and operation, and stop without a UUID watcherId.

import { z } from 'zod';

import { folderPathSchema } from '../../shared/validation.js';

const WATCH_ACTIONS = ['start', 'stop', 'list', 'status'] as const;

const watchActionSchema = z.enum(WATCH_ACTIONS);

const WATCH_OPERATIONS = ['upscale', 'removeBackground', 'caption', 'vectorize', 'controlNetPreprocess'] as const;

const watchOperationSchema = z.enum(WATCH_OPERATIONS);

export type WatchOperation = z.infer<typeof watchOperationSchema>;

export const watchFolderInputSchema = z
  .object({
    action: watchActionSchema,

    folderPath: folderPathSchema.optional(),

    operation: watchOperationSchema.optional(),

    operationParams: z.record(z.string(), z.unknown()).optional(),

    outputFolder: folderPathSchema.optional(),

    watcherId: z.uuid().optional(),
  })
  .refine(
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

const watcherInfoSchema = z.object({
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

const watchFolderOutputSchema = z.object({
  action: z.string(),

  watcherId: z.string().optional(),

  watchers: z.array(watcherInfoSchema).optional(),

  watcher: watcherInfoSchema.optional(),

  message: z.string(),
});

export type WatchFolderOutput = z.infer<typeof watchFolderOutputSchema>;
