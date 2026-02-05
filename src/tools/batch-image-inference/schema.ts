/**
 * Schema definitions for the batch image inference tool.
 *
 * Generates multiple images from multiple prompts with common settings.
 * Supports concurrent generation with progress reporting.
 */

import { z } from 'zod';

import {
  cfgScaleSchema,
  concurrencySchema,
  dimensionSchema,
  modelIdentifierSchema,
  negativePromptSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  positivePromptSchema,
  stepsSchema,
} from '../../shared/validation.js';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for batch image inference input.
 */
export const batchImageInferenceInputSchema = z.object({
  /**
   * Array of prompts to generate images for.
   * Each prompt produces one image.
   * Minimum 1, maximum 20 prompts.
   */
  prompts: z
    .array(positivePromptSchema)
    .min(1, 'Must provide at least 1 prompt')
    .max(20, 'Cannot process more than 20 prompts'),

  /**
   * Model identifier in AIR format.
   */
  model: modelIdentifierSchema,

  /**
   * Image width in pixels (512-2048, multiple of 64).
   */
  width: dimensionSchema.optional().default(1024),

  /**
   * Image height in pixels (512-2048, multiple of 64).
   */
  height: dimensionSchema.optional().default(1024),

  /**
   * Number of diffusion steps (1-100).
   */
  steps: stepsSchema.optional(),

  /**
   * Classifier-Free Guidance scale (0-50).
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API parameter name
  CFGScale: cfgScaleSchema.optional(),

  /**
   * Text describing what to avoid in the images.
   * Applied to all prompts.
   */
  negativePrompt: negativePromptSchema,

  /**
   * Scheduler/sampler for diffusion process.
   */
  scheduler: z.string().optional(),

  /**
   * How to return the generated images.
   */
  outputType: outputTypeSchema.optional(),

  /**
   * Image format for output.
   */
  outputFormat: outputFormatSchema.optional(),

  /**
   * Output quality (20-99, for JPG/WebP).
   */
  outputQuality: outputQualitySchema.optional(),

  /**
   * Number of prompts to process concurrently.
   * Default: 2, Maximum: 5
   */
  concurrency: concurrencySchema,

  /**
   * Whether to stop generation on first error.
   * Default: false (continue with remaining prompts)
   */
  stopOnError: z.boolean().optional().default(false),

  /**
   * Include cost information for each generation.
   * Default: true
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated batch image inference input.
 */
export type BatchImageInferenceInput = z.infer<typeof batchImageInferenceInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for a single image result in the batch.
 */
export const batchImageResultSchema = z.object({
  /**
   * Unique identifier for the generated image.
   */
  imageUUID: z.string(),

  /**
   * URL to the generated image.
   */
  imageURL: z.string().optional(),

  /**
   * Base64-encoded image data.
   */
  imageBase64Data: z.string().optional(),

  /**
   * Data URI with base64 image.
   */
  imageDataURI: z.string().optional(),

  /**
   * Seed used for generation.
   */
  seed: z.number().optional(),
});

/**
 * Schema for a single prompt result in the batch.
 */
export const batchPromptResultSchema = z.object({
  /**
   * The prompt that was used.
   */
  prompt: z.string(),

  /**
   * Index of this prompt in the input array.
   */
  index: z.number(),

  /**
   * Processing status for this prompt.
   */
  status: z.enum(['success', 'failed']),

  /**
   * Generated images (if successful).
   */
  images: z.array(batchImageResultSchema).optional(),

  /**
   * Error message if generation failed.
   */
  error: z.string().optional(),

  /**
   * Cost of generating this image (USD).
   */
  cost: z.number().optional(),
});

/**
 * Type for batch prompt result.
 */
export type BatchPromptResult = z.infer<typeof batchPromptResultSchema>;

/**
 * Schema for batch image inference output.
 */
export const batchImageInferenceOutputSchema = z.object({
  /**
   * Total number of prompts processed.
   */
  total: z.number(),

  /**
   * Number of successful generations.
   */
  successful: z.number(),

  /**
   * Number of failed generations.
   */
  failed: z.number(),

  /**
   * Detailed results for each prompt.
   */
  results: z.array(batchPromptResultSchema),

  /**
   * Total cost of all generations (USD).
   */
  totalCost: z.number().optional(),
});

/**
 * Type for batch image inference output.
 */
export type BatchImageInferenceOutput = z.infer<typeof batchImageInferenceOutputSchema>;
