// Does:  Validates processFolder input and describes the per-file results.
// Holds: folderPath and outputFolder must pass the allowed-root folder check, and maxFiles is bounded to 1-100.

import { z } from 'zod';

import { concurrencySchema, folderPathSchema } from '../../shared/validation.js';

const FOLDER_OPERATIONS = ['upscale', 'removeBackground', 'caption', 'vectorize', 'controlNetPreprocess'] as const;

const folderOperationSchema = z.enum(FOLDER_OPERATIONS);

export type FolderOperation = z.infer<typeof folderOperationSchema>;

export const processFolderInputSchema = z.object({
  folderPath: folderPathSchema,

  operation: folderOperationSchema,

  // Holds: Free-form here; the handler keeps only known keys of the expected type and drops the rest.
  operationParams: z.record(z.string(), z.unknown()).optional(),

  recursive: z.boolean().optional().default(false),

  maxFiles: z.number().int().min(1).max(100).optional().default(50),

  outputFolder: folderPathSchema.optional(),

  outputSuffix: z.string().optional().default('_processed'),

  concurrency: concurrencySchema,

  stopOnError: z.boolean().optional().default(false),

  includeCost: z.boolean().optional().default(true),
});

const fileResultStatusSchema = z.enum(['success', 'failed', 'skipped']);

const fileResultSchema = z.object({
  inputPath: z.string(),

  outputPath: z.string().optional(),

  status: fileResultStatusSchema,

  error: z.string().optional(),

  cost: z.number().optional(),

  result: z.record(z.string(), z.unknown()).optional(),
});

export type FileResult = z.infer<typeof fileResultSchema>;

const processFolderOutputSchema = z.object({
  processed: z.number(),

  failed: z.number(),

  skipped: z.number(),

  total: z.number(),

  results: z.array(fileResultSchema),

  totalCost: z.number().optional(),
});

export type ProcessFolderOutput = z.infer<typeof processFolderOutputSchema>;
