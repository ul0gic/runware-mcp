/**
 * Schema definitions for the photo maker tool.
 *
 * PhotoMaker enables identity-preserving image generation.
 * It requires 1-4 input images and automatically prepends
 * the "img" trigger word if not present in the prompt.
 */

import { z } from 'zod';

import {
  cfgScaleSchema,
  dimensionSchema,
  imageInputSchema,
  negativePromptSchema,
  numberResultsSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  positivePromptSchema,
  seedSchema,
  stepsSchema,
  strengthSchema,
} from '../../shared/validation.js';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for photo maker input.
 *
 * PhotoMaker requires identity reference images and uses
 * a special trigger word to preserve facial identity.
 */
export const photoMakerInputSchema = z.object({
  // ========================================================================
  // Required Parameters
  // ========================================================================

  /**
   * Text description of the desired image.
   * The "img" trigger word will be auto-prepended if not present.
   */
  positivePrompt: positivePromptSchema,

  /**
   * Identity reference images (1-4 images).
   * These images provide the face/identity to preserve.
   */
  inputImages: z.array(imageInputSchema).min(1).max(4),

  // ========================================================================
  // Model Selection
  // ========================================================================

  /**
   * PhotoMaker model identifier.
   * Defaults to the standard PhotoMaker model.
   */
  model: z.string().optional().default('civitai:139562@344487'),

  // ========================================================================
  // Dimensions
  // ========================================================================

  /**
   * Image width in pixels (512-2048, multiple of 64).
   */
  width: dimensionSchema.optional().default(1024),

  /**
   * Image height in pixels (512-2048, multiple of 64).
   */
  height: dimensionSchema.optional().default(1024),

  // ========================================================================
  // Generation Control
  // ========================================================================

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
   * Random seed for reproducible generation.
   */
  seed: seedSchema,

  /**
   * Scheduler/sampler for diffusion process.
   */
  scheduler: z.string().optional(),

  /**
   * Number of images to generate (1-20).
   */
  numberResults: numberResultsSchema.optional().default(1),

  /**
   * Text describing what to avoid in the image.
   */
  negativePrompt: negativePromptSchema,

  // ========================================================================
  // Identity Control
  // ========================================================================

  /**
   * Style strength (0-1).
   * Lower values preserve identity more strictly.
   * Higher values allow more creative freedom.
   */
  styleStrength: z.number().min(0).max(1).optional().default(0.5),

  /**
   * Denoising strength (0-1).
   * Controls how much the generation diverges from references.
   */
  strength: strengthSchema.optional(),

  // ========================================================================
  // Output Configuration
  // ========================================================================

  /**
   * How to return the generated image.
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
   * Include cost information in response.
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated photo maker input.
 */
export type PhotoMakerInput = z.infer<typeof photoMakerInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for a single generated image result.
 */
export const photoMakerResultSchema = z.object({
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
   * Seed used for this specific image.
   */
  seed: z.number().optional(),
});

/**
 * Schema for photo maker output.
 */
export const photoMakerOutputSchema = z.object({
  /**
   * Array of generated images.
   */
  images: z.array(photoMakerResultSchema),

  /**
   * Total cost of the generation (USD).
   */
  cost: z.number().optional(),
});

/**
 * Type for photo maker output.
 */
export type PhotoMakerOutput = z.infer<typeof photoMakerOutputSchema>;
