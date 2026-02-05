/**
 * Common validation schemas for the Runware MCP server.
 *
 * This module provides reusable Zod schemas for validating inputs
 * across all tools. Every input passes through these validators.
 */

import { z } from 'zod';

import {
  type ImageUUID,
  type TaskUUID,
  createImageUUID,
  createTaskUUID,
} from './types.js';

// ============================================================================
// UUID Schemas
// ============================================================================

/**
 * UUID v4 validation pattern.
 */
const UUID_V4_REGEX = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

/**
 * Schema for validating UUID v4 strings.
 */
export const uuidSchema = z
  .string()
  .regex(UUID_V4_REGEX, 'Must be a valid UUID v4');

/**
 * Schema for TaskUUID branded type.
 * Validates UUID format and transforms to branded type.
 */
export const taskUUIDSchema = uuidSchema.transform((uuid): TaskUUID => createTaskUUID(uuid));

/**
 * Schema for ImageUUID branded type.
 * Validates UUID format and transforms to branded type.
 */
export const imageUUIDSchema = uuidSchema.transform((uuid): ImageUUID => createImageUUID(uuid));

// ============================================================================
// URL Schemas
// ============================================================================

/**
 * Allowed URL protocols for image/media sources.
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

/**
 * Schema for validating URLs.
 * Ensures the URL is well-formed and uses allowed protocols.
 */
export const urlSchema = z.url('Must be a valid URL').refine(
  (urlString) => {
    try {
      const parsedUrl = new URL(urlString);
      return (ALLOWED_PROTOCOLS as readonly string[]).includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  },
  { message: 'URL must use http or https protocol' },
);

// ============================================================================
// Image Input Schemas
// ============================================================================

/**
 * Base64 string pattern (allows base64 and base64url).
 */
const BASE64_REGEX = /^[\w+/]+=*$/;

/**
 * Data URI pattern for images.
 */
const DATA_URI_REGEX = /^data:image\/(jpeg|jpg|png|webp|gif|bmp);base64,[\w+/]+=*$/i;

/**
 * Schema for image inputs.
 * Accepts: UUID, URL, base64 data, or data URI.
 *
 * This is the most flexible input schema for image sources.
 */
export const imageInputSchema = z.union([
  // UUID format (Runware image reference)
  uuidSchema.describe('Runware image UUID'),

  // URL format
  urlSchema.describe('Image URL'),

  // Base64 data (raw, no prefix)
  z
    .string()
    .min(100, 'Base64 data appears too short')
    .regex(BASE64_REGEX, 'Invalid base64 format')
    .describe('Base64 encoded image data'),

  // Data URI format
  z
    .string()
    .regex(DATA_URI_REGEX, 'Invalid data URI format')
    .describe('Data URI with base64 image'),
]);

/**
 * Type for image input values.
 */
export type ImageInput = z.infer<typeof imageInputSchema>;

// ============================================================================
// Dimension Schemas
// ============================================================================

/**
 * Minimum image dimension in pixels.
 */
export const MIN_DIMENSION = 512;

/**
 * Maximum image dimension in pixels.
 */
export const MAX_DIMENSION = 2048;

/**
 * Dimension step size (must be multiple of this).
 */
export const DIMENSION_STEP = 64;

/**
 * Schema for image dimensions.
 * Must be a multiple of 64, between 512 and 2048.
 */
export const dimensionSchema = z
  .number()
  .int('Dimension must be an integer')
  .min(MIN_DIMENSION, `Dimension must be at least ${String(MIN_DIMENSION)}px`)
  .max(MAX_DIMENSION, `Dimension cannot exceed ${String(MAX_DIMENSION)}px`)
  .refine(
    (value) => value % DIMENSION_STEP === 0,
    { message: `Dimension must be a multiple of ${String(DIMENSION_STEP)}` },
  );

/**
 * Schema for width with default value.
 */
export const widthSchema = dimensionSchema.default(1024);

/**
 * Schema for height with default value.
 */
export const heightSchema = dimensionSchema.default(1024);

// ============================================================================
// Generation Parameter Schemas
// ============================================================================

/**
 * Minimum generation steps.
 */
export const MIN_STEPS = 1;

/**
 * Maximum generation steps.
 */
export const MAX_STEPS = 100;

/**
 * Schema for generation steps.
 * Controls the number of diffusion steps.
 */
export const stepsSchema = z
  .number()
  .int('Steps must be an integer')
  .min(MIN_STEPS, `Steps must be at least ${String(MIN_STEPS)}`)
  .max(MAX_STEPS, `Steps cannot exceed ${String(MAX_STEPS)}`);

/**
 * Minimum CFG scale value.
 */
export const MIN_CFG_SCALE = 0;

/**
 * Maximum CFG scale value.
 */
export const MAX_CFG_SCALE = 50;

/**
 * Schema for CFG (Classifier-Free Guidance) scale.
 * Controls how closely the image follows the prompt.
 */
export const cfgScaleSchema = z
  .number()
  .min(MIN_CFG_SCALE, `CFG scale must be at least ${String(MIN_CFG_SCALE)}`)
  .max(MAX_CFG_SCALE, `CFG scale cannot exceed ${String(MAX_CFG_SCALE)}`);

/**
 * Schema for random seed.
 * Optional seed for reproducible generation.
 */
export const seedSchema = z
  .number()
  .int('Seed must be an integer')
  .min(0, 'Seed must be non-negative')
  .optional();

/**
 * Schema for number of results.
 */
export const numberResultsSchema = z
  .number()
  .int('Number of results must be an integer')
  .min(1, 'Must generate at least 1 result')
  .max(20, 'Cannot generate more than 20 results');

/**
 * Schema for strength parameter (for img2img, inpainting).
 * Controls how much the seed image influences the output.
 */
export const strengthSchema = z
  .number()
  .min(0, 'Strength must be at least 0')
  .max(1, 'Strength cannot exceed 1');

// ============================================================================
// Output Schemas
// ============================================================================

/**
 * Output type options.
 */
export const OUTPUT_TYPES = ['URL', 'base64Data', 'dataURI'] as const;

/**
 * Schema for output type.
 * Determines how generated media is returned.
 */
export const outputTypeSchema = z.enum(OUTPUT_TYPES);

/**
 * Type for output type values.
 */
export type OutputType = z.infer<typeof outputTypeSchema>;

/**
 * Image output format options.
 */
export const IMAGE_OUTPUT_FORMATS = ['JPG', 'PNG', 'WEBP'] as const;

/**
 * Schema for image output format.
 */
export const outputFormatSchema = z.enum(IMAGE_OUTPUT_FORMATS);

/**
 * Type for image output format values.
 */
export type ImageOutputFormat = z.infer<typeof outputFormatSchema>;

/**
 * Video output format options.
 */
export const VIDEO_OUTPUT_FORMATS = ['MP4', 'WEBM', 'MOV'] as const;

/**
 * Schema for video output format.
 */
export const videoOutputFormatSchema = z.enum(VIDEO_OUTPUT_FORMATS);

/**
 * Type for video output format values.
 */
export type VideoOutputFormat = z.infer<typeof videoOutputFormatSchema>;

/**
 * Schema for output quality (JPEG/WebP quality).
 */
export const outputQualitySchema = z
  .number()
  .int('Output quality must be an integer')
  .min(20, 'Output quality must be at least 20')
  .max(99, 'Output quality cannot exceed 99');

/**
 * Delivery method options.
 */
export const DELIVERY_METHODS = ['sync', 'async'] as const;

/**
 * Schema for delivery method.
 * - sync: Wait for result in the same request
 * - async: Return immediately, poll for result
 */
export const deliveryMethodSchema = z.enum(DELIVERY_METHODS);

/**
 * Type for delivery method values.
 */
export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;

// ============================================================================
// Model Identifier Schema
// ============================================================================

/**
 * AIR model identifier pattern.
 * Format: provider:modelId@version or civitai:modelId@versionId
 */
const AIR_MODEL_REGEX = /^[\w-]+:\d+@\d+$/;

/**
 * Schema for AIR model identifiers.
 */
export const modelIdentifierSchema = z
  .string()
  .regex(AIR_MODEL_REGEX, 'Model must be in AIR format (e.g., civitai:123@456)');

// ============================================================================
// Prompt Schemas
// ============================================================================

/**
 * Minimum prompt length.
 */
export const MIN_PROMPT_LENGTH = 2;

/**
 * Maximum prompt length.
 */
export const MAX_PROMPT_LENGTH = 3000;

/**
 * Schema for positive prompts.
 */
export const positivePromptSchema = z
  .string()
  .min(MIN_PROMPT_LENGTH, `Prompt must be at least ${String(MIN_PROMPT_LENGTH)} characters`)
  .max(MAX_PROMPT_LENGTH, `Prompt cannot exceed ${String(MAX_PROMPT_LENGTH)} characters`);

/**
 * Schema for negative prompts.
 */
export const negativePromptSchema = z
  .string()
  .max(MAX_PROMPT_LENGTH, `Negative prompt cannot exceed ${String(MAX_PROMPT_LENGTH)} characters`)
  .optional();

// ============================================================================
// Duration Schemas
// ============================================================================

/**
 * Schema for video duration in seconds.
 */
export const videoDurationSchema = z
  .number()
  .min(1, 'Video duration must be at least 1 second')
  .max(10, 'Video duration cannot exceed 10 seconds');

/**
 * Schema for audio duration in seconds.
 */
export const audioDurationSchema = z
  .number()
  .int('Audio duration must be an integer')
  .min(10, 'Audio duration must be at least 10 seconds')
  .max(300, 'Audio duration cannot exceed 300 seconds');

// ============================================================================
// FPS Schema
// ============================================================================

/**
 * Schema for video FPS.
 */
export const fpsSchema = z
  .number()
  .int('FPS must be an integer')
  .min(15, 'FPS must be at least 15')
  .max(60, 'FPS cannot exceed 60');

// ============================================================================
// File Path Schema
// ============================================================================

/**
 * Schema for file paths.
 * Must be an absolute path.
 */
export const filePathSchema = z
  .string()
  .min(1, 'File path cannot be empty')
  .refine(
    (path) => path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path),
    { message: 'File path must be absolute' },
  );

/**
 * Schema for folder paths.
 * Must be an absolute path.
 */
export const folderPathSchema = filePathSchema.describe('Absolute folder path');

// ============================================================================
// Common Option Schemas
// ============================================================================

/**
 * Schema for include cost flag.
 */
export const includeCostSchema = z.boolean().optional().default(true);

/**
 * Schema for concurrency limit.
 */
export const concurrencySchema = z
  .number()
  .int('Concurrency must be an integer')
  .min(1, 'Concurrency must be at least 1')
  .max(5, 'Concurrency cannot exceed 5')
  .default(2);

// ============================================================================
// ControlNet Schemas
// ============================================================================

/**
 * ControlNet preprocessor types.
 */
export const CONTROLNET_PREPROCESSORS = [
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

/**
 * Schema for ControlNet preprocessor type.
 */
export const controlNetPreprocessorSchema = z.enum(CONTROLNET_PREPROCESSORS);

/**
 * Type for ControlNet preprocessor values.
 */
export type ControlNetPreprocessor = z.infer<typeof controlNetPreprocessorSchema>;

/**
 * Schema for a single ControlNet configuration.
 */
export const controlNetConfigSchema = z.object({
  /**
   * Guide image for the ControlNet.
   */
  guideImage: imageInputSchema,

  /**
   * Preprocessor type.
   */
  preprocessor: controlNetPreprocessorSchema,

  /**
   * ControlNet model identifier.
   */
  model: z.string().optional(),

  /**
   * Weight/influence of this ControlNet (0-1).
   */
  weight: z.number().min(0).max(1).optional(),

  /**
   * Start step for ControlNet influence (0-1).
   */
  startStep: z.number().min(0).max(1).optional(),

  /**
   * End step for ControlNet influence (0-1).
   */
  endStep: z.number().min(0).max(1).optional(),
});

/**
 * Schema for ControlNet array (max 4 ControlNets).
 */
export const controlNetArraySchema = z
  .array(controlNetConfigSchema)
  .max(4, 'Cannot use more than 4 ControlNets');

// ============================================================================
// LoRA Schema
// ============================================================================

/**
 * Schema for a single LoRA configuration.
 */
export const loraConfigSchema = z.object({
  /**
   * LoRA model identifier.
   */
  model: z.string(),

  /**
   * Weight/influence of this LoRA.
   */
  weight: z.number().min(-2).max(2).optional().default(1),
});

/**
 * Schema for LoRA array (max 5 LoRAs).
 */
export const loraArraySchema = z
  .array(loraConfigSchema)
  .max(5, 'Cannot use more than 5 LoRAs');

// ============================================================================
// Upscale Schemas
// ============================================================================

/**
 * Upscale factor options.
 */
export const UPSCALE_FACTORS = [2, 4] as const;

/**
 * Schema for upscale factor.
 */
export const upscaleFactorSchema = z.union([
  z.literal(2),
  z.literal(4),
]);

/**
 * Type for upscale factor values.
 */
export type UpscaleFactor = z.infer<typeof upscaleFactorSchema>;
