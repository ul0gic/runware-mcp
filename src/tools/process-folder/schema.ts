/**
 * Schema definitions for the process folder tool.
 *
 * Enables batch processing of all images in a folder with a specified operation.
 * Supports upscale, background removal, caption, vectorize, and ControlNet preprocessing.
 */

import { z } from 'zod';

import { concurrencySchema, folderPathSchema } from '../../shared/validation.js';

// ============================================================================
// Operations
// ============================================================================

/**
 * Available operations for folder processing.
 */
export const FOLDER_OPERATIONS = [
  'upscale',
  'removeBackground',
  'caption',
  'vectorize',
  'controlNetPreprocess',
] as const;

/**
 * Schema for folder operation type.
 */
export const folderOperationSchema = z.enum(FOLDER_OPERATIONS);

/**
 * Type for folder operation values.
 */
export type FolderOperation = z.infer<typeof folderOperationSchema>;

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for process folder input.
 */
export const processFolderInputSchema = z.object({
  /**
   * Path to the folder containing images to process.
   * Must be an absolute path under an allowed root.
   */
  folderPath: folderPathSchema,

  /**
   * Operation to perform on each image.
   */
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

  /**
   * Whether to recursively process subdirectories.
   * Default: false
   */
  recursive: z.boolean().optional().default(false),

  /**
   * Maximum number of files to process.
   * Default: 50, Maximum: 100
   */
  maxFiles: z.number().int().min(1).max(100).optional().default(50),

  /**
   * Output folder for processed files.
   * If not specified, outputs alongside input files with suffix.
   */
  outputFolder: folderPathSchema.optional(),

  /**
   * Suffix to append to output filenames.
   * Default: "_processed"
   */
  outputSuffix: z.string().optional().default('_processed'),

  /**
   * Number of files to process concurrently.
   * Default: 2, Maximum: 5
   */
  concurrency: concurrencySchema,

  /**
   * Whether to stop processing on first error.
   * Default: false (continue processing remaining files)
   */
  stopOnError: z.boolean().optional().default(false),

  /**
   * Include cost information for each processed file.
   * Default: true
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated process folder input.
 */
export type ProcessFolderInput = z.infer<typeof processFolderInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Status of an individual file processing result.
 */
export const fileResultStatusSchema = z.enum(['success', 'failed', 'skipped']);

/**
 * Schema for individual file result.
 */
export const fileResultSchema = z.object({
  /**
   * Input file path.
   */
  inputPath: z.string(),

  /**
   * Output file path (for operations that produce files).
   */
  outputPath: z.string().optional(),

  /**
   * Processing status for this file.
   */
  status: fileResultStatusSchema,

  /**
   * Error message if processing failed.
   */
  error: z.string().optional(),

  /**
   * Cost of processing this file (USD).
   */
  cost: z.number().optional(),

  /**
   * Operation-specific result data.
   * For caption: { caption: string }
   * For upscale: { imageUUID: string, imageURL?: string }
   * etc.
   */
  result: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Type for file result.
 */
export type FileResult = z.infer<typeof fileResultSchema>;

/**
 * Schema for process folder output.
 */
export const processFolderOutputSchema = z.object({
  /**
   * Number of files successfully processed.
   */
  processed: z.number(),

  /**
   * Number of files that failed to process.
   */
  failed: z.number(),

  /**
   * Number of files skipped.
   */
  skipped: z.number(),

  /**
   * Total number of files found.
   */
  total: z.number(),

  /**
   * Detailed results for each file.
   */
  results: z.array(fileResultSchema),

  /**
   * Total cost of all operations (USD).
   */
  totalCost: z.number().optional(),
});

/**
 * Type for process folder output.
 */
export type ProcessFolderOutput = z.infer<typeof processFolderOutputSchema>;
