import { z } from 'zod';

import { concurrencySchema, folderPathSchema } from '../../shared/validation.js';

export const FOLDER_OPERATIONS = [
  'upscale',
  'removeBackground',
  'caption',
  'vectorize',
  'controlNetPreprocess',
] as const;

export const folderOperationSchema = z.enum(FOLDER_OPERATIONS);

export type FolderOperation = z.infer<typeof folderOperationSchema>;

export const processFolderInputSchema = z.object({
  /** Must be an absolute path under an allowed root. */
  folderPath: folderPathSchema,

  operation: folderOperationSchema,

  /**
   * Operation-specific parameters passed to the underlying tool.
   * For upscale: { upscaleFactor?: 2 | 4, model?: string }
   * For removeBackground: { model?: string, rgba?: boolean }
   * For caption: { maxLength?: number }
   * For vectorize: { model?: string }
   * For controlNetPreprocess: { preprocessor: string, lowThreshold?: number, highThreshold?: number }
   */
  operationParams: z.record(z.string(), z.unknown()).optional(),

  recursive: z.boolean().optional().default(false),

  maxFiles: z.number().int().min(1).max(100).optional().default(50),

  /** Defaults to writing alongside the input files with the output suffix. */
  outputFolder: folderPathSchema.optional(),

  outputSuffix: z.string().optional().default('_processed'),

  concurrency: concurrencySchema,

  stopOnError: z.boolean().optional().default(false),

  includeCost: z.boolean().optional().default(true),
});

export type ProcessFolderInput = z.infer<typeof processFolderInputSchema>;

export const fileResultStatusSchema = z.enum(['success', 'failed', 'skipped']);

export const fileResultSchema = z.object({
  inputPath: z.string(),

  outputPath: z.string().optional(),

  status: fileResultStatusSchema,

  error: z.string().optional(),

  cost: z.number().optional(),

  /**
   * Operation-specific result data.
   * For caption: { caption: string }
   * For upscale: { imageUUID: string, imageURL?: string }
   * etc.
   */
  result: z.record(z.string(), z.unknown()).optional(),
});

export type FileResult = z.infer<typeof fileResultSchema>;

export const processFolderOutputSchema = z.object({
  processed: z.number(),

  failed: z.number(),

  skipped: z.number(),

  total: z.number(),

  results: z.array(fileResultSchema),

  totalCost: z.number().optional(),
});

export type ProcessFolderOutput = z.infer<typeof processFolderOutputSchema>;
