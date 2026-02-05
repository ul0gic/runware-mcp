/**
 * Schema definitions for the image inference tool.
 *
 * This is the most comprehensive tool with support for text-to-image,
 * image-to-image, inpainting, outpainting, and advanced features like
 * ControlNet, LoRA, IP-Adapters, and identity preservation.
 */

import { z } from 'zod';

import { providerSettingsSchema } from '../../shared/provider-settings.js';
import {
  cfgScaleSchema,
  controlNetArraySchema,
  dimensionSchema,
  imageInputSchema,
  loraArraySchema,
  modelIdentifierSchema,
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
// Advanced Feature Schemas
// ============================================================================

/**
 * Schema for embedding configuration.
 */
export const embeddingConfigSchema = z.object({
  /**
   * Embedding model identifier.
   */
  model: z.string(),

  /**
   * Weight/influence of this embedding.
   */
  weight: z.number().min(-2).max(2).optional().default(1),
});

/**
 * Schema for IP-Adapter configuration.
 */
export const ipAdapterConfigSchema = z.object({
  /**
   * IP-Adapter model identifier.
   */
  model: z.string(),

  /**
   * Guide images for the IP-Adapter.
   */
  guideImages: z.array(imageInputSchema).min(1).max(4),

  /**
   * Weight/influence of this IP-Adapter (0-1).
   */
  weight: z.number().min(0).max(1).optional(),

  /**
   * Start step for IP-Adapter influence (0-1).
   */
  startStep: z.number().min(0).max(1).optional(),

  /**
   * End step for IP-Adapter influence (0-1).
   */
  endStep: z.number().min(0).max(1).optional(),

  /**
   * Weighting mode for IP-Adapter.
   */
  mode: z.enum(['style_transfer', 'composition', 'face_id', 'plus', 'plus_face']).optional(),
});

/**
 * Schema for refiner configuration.
 */
export const refinerConfigSchema = z.object({
  /**
   * Refiner model identifier.
   */
  model: z.string(),

  /**
   * Step to start using the refiner (0-1).
   */
  startStep: z.number().min(0).max(1).optional(),
});

/**
 * Schema for PuLID (identity preservation) configuration.
 */
export const pulidConfigSchema = z.object({
  /**
   * Identity reference images.
   */
  inputImages: z.array(imageInputSchema).min(1).max(4),

  /**
   * Identity weight (0-3).
   */
  idWeight: z.number().min(0).max(3).optional(),

  /**
   * True CFG scale (1-3).
   */
  trueCFGScale: z.number().min(1).max(3).optional(),

  /**
   * Start step for PuLID influence.
   */
  startStep: z.number().int().min(0).optional(),

  /**
   * Max timestep for PuLID.
   */
  maxTimestep: z.number().int().optional(),
});

/**
 * Schema for ACE++ (character-consistent generation) configuration.
 */
export const acePlusPlusConfigSchema = z.object({
  /**
   * Reference image for character consistency.
   */
  referenceImage: imageInputSchema,

  /**
   * Generation mode.
   */
  mode: z.enum(['portrait', 'subject', 'local_editing']).optional(),

  /**
   * Reference weight.
   */
  weight: z.number().min(0).max(1).optional(),
});

/**
 * Schema for outpainting configuration.
 */
export const outpaintConfigSchema = z.object({
  /**
   * Pixels to extend on the left.
   */
  left: z.number().int().min(0).max(512).optional(),

  /**
   * Pixels to extend on the right.
   */
  right: z.number().int().min(0).max(512).optional(),

  /**
   * Pixels to extend on the top.
   */
  top: z.number().int().min(0).max(512).optional(),

  /**
   * Pixels to extend on the bottom.
   */
  bottom: z.number().int().min(0).max(512).optional(),

  /**
   * Blur amount for blending.
   */
  blur: z.number().int().min(0).max(64).optional(),
});

/**
 * Schema for safety/content filtering.
 */
export const safetyConfigSchema = z.object({
  /**
   * Enable content safety checking.
   */
  checkContent: z.boolean().optional(),
});

/**
 * Schema for Ultralytics face enhancement.
 */
export const ultralyticsConfigSchema = z.object({
  /**
   * Confidence threshold for face detection.
   */
  confidence: z.number().min(0).max(1).optional(),

  /**
   * CFG scale for face enhancement.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API parameter name
  CFGScale: z.number().min(0).max(50).optional(),

  /**
   * Steps for face enhancement.
   */
  steps: z.number().int().min(1).max(100).optional(),
});

// ============================================================================
// Main Input Schema
// ============================================================================

/**
 * Complete input schema for image inference.
 *
 * Supports all Runware image inference features including:
 * - Text-to-image generation
 * - Image-to-image transformation
 * - Inpainting and outpainting
 * - ControlNet guidance
 * - LoRA style adaptation
 * - IP-Adapters for image-prompted generation
 * - Identity preservation (PuLID, ACE++)
 * - Provider-specific settings
 */
export const imageInferenceInputSchema = z.object({
  // ========================================================================
  // Required Parameters
  // ========================================================================

  /**
   * Text description of the desired image.
   */
  positivePrompt: positivePromptSchema,

  /**
   * Model identifier in AIR format (e.g., "civitai:123@456").
   */
  model: modelIdentifierSchema,

  // ========================================================================
  // Dimensions (optional, with defaults)
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
   * Higher values follow the prompt more closely.
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
  // Image Inputs (for img2img, inpainting, etc.)
  // ========================================================================

  /**
   * Seed image for image-to-image or inpainting.
   * Accepts UUID, URL, base64, or data URI.
   */
  seedImage: imageInputSchema.optional(),

  /**
   * Mask image for inpainting (white = edit area).
   * Accepts UUID, URL, base64, or data URI.
   */
  maskImage: imageInputSchema.optional(),

  /**
   * Reference images for style/composition guidance.
   * Maximum 2 images for FLUX.1 Kontext.
   */
  referenceImages: z.array(imageInputSchema).max(4).optional(),

  /**
   * Denoising strength for img2img (0-1).
   * Higher values allow more changes.
   */
  strength: strengthSchema.optional(),

  // ========================================================================
  // Inpainting/Outpainting
  // ========================================================================

  /**
   * Extra context pixels for inpainting (32-128).
   * Adds surrounding area for better blending.
   */
  maskMargin: z.number().int().min(32).max(128).optional(),

  /**
   * Outpainting configuration to extend image boundaries.
   */
  outpaint: outpaintConfigSchema.optional(),

  // ========================================================================
  // Style and Control (Advanced)
  // ========================================================================

  /**
   * ControlNet configurations for structural guidance.
   * Maximum 4 ControlNets.
   */
  controlNet: controlNetArraySchema.optional(),

  /**
   * LoRA configurations for style/subject emphasis.
   * Maximum 5 LoRAs.
   */
  lora: loraArraySchema.optional(),

  /**
   * Embedding configurations for custom concepts.
   */
  embeddings: z.array(embeddingConfigSchema).max(5).optional(),

  /**
   * IP-Adapter configurations for image-prompted generation.
   */
  ipAdapters: z.array(ipAdapterConfigSchema).max(4).optional(),

  /**
   * Refiner model for two-stage generation (SDXL).
   */
  refiner: refinerConfigSchema.optional(),

  /**
   * VAE model override for visual decoder.
   */
  vae: z.string().optional(),

  // ========================================================================
  // Identity Preservation
  // ========================================================================

  /**
   * PuLID configuration for fast identity transfer.
   */
  pulid: pulidConfigSchema.optional(),

  /**
   * ACE++ configuration for character-consistent generation.
   */
  acePlusPlus: acePlusPlusConfigSchema.optional(),

  // ========================================================================
  // Acceleration
  // ========================================================================

  /**
   * Acceleration level for faster generation.
   * - none: No acceleration
   * - low: Minor speedup
   * - medium: Balanced speedup
   * - high: Maximum speedup (may affect quality)
   */
  acceleration: z.enum(['none', 'low', 'medium', 'high']).optional(),

  /**
   * Enable TeaCache for transformer models (Flux, SD3).
   */
  teaCache: z.boolean().optional(),

  /**
   * Enable DeepCache for UNet models (SDXL, SD1.5).
   */
  deepCache: z.boolean().optional(),

  // ========================================================================
  // Provider-Specific Settings
  // ========================================================================

  /**
   * Provider-specific configuration.
   * Use the appropriate nested object for the model's provider.
   */
  providerSettings: providerSettingsSchema.optional(),

  // ========================================================================
  // Face Enhancement
  // ========================================================================

  /**
   * Ultralytics face detection and enhancement settings.
   */
  ultralytics: ultralyticsConfigSchema.optional(),

  // ========================================================================
  // Output Configuration
  // ========================================================================

  /**
   * How to return the generated image.
   * - URL: Accessible URL (default)
   * - base64Data: Base64-encoded string
   * - dataURI: Data URI with base64
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

  // ========================================================================
  // Safety and Metadata
  // ========================================================================

  /**
   * Content safety configuration.
   */
  safety: safetyConfigSchema.optional(),

  /**
   * Include cost information in response.
   */
  includeCost: z.boolean().optional().default(true),

  /**
   * Time-to-live for generated URLs (seconds).
   * Minimum 60 seconds.
   */
  ttl: z.number().int().min(60).optional(),
});

/**
 * Type for validated image inference input.
 */
export type ImageInferenceInput = z.infer<typeof imageInferenceInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for a single generated image result.
 */
export const imageResultSchema = z.object({
  /**
   * Unique identifier for the generated image.
   */
  imageUUID: z.string(),

  /**
   * URL to the generated image (if outputType is URL).
   */
  imageURL: z.string().optional(),

  /**
   * Base64-encoded image data (if outputType is base64Data).
   */
  imageBase64Data: z.string().optional(),

  /**
   * Data URI with base64 image (if outputType is dataURI).
   */
  imageDataURI: z.string().optional(),

  /**
   * Seed used for this specific image.
   */
  seed: z.number().optional(),

  /**
   * Whether NSFW content was detected.
   */
  nsfwContent: z.boolean().optional(),
});

/**
 * Schema for image inference output.
 */
export const imageInferenceOutputSchema = z.object({
  /**
   * Array of generated images.
   */
  images: z.array(imageResultSchema),

  /**
   * Total cost of the generation (USD).
   */
  cost: z.number().optional(),
});

/**
 * Type for image inference output.
 */
export type ImageInferenceOutput = z.infer<typeof imageInferenceOutputSchema>;
