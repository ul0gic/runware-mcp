/**
 * Schema definitions for the video inference tool.
 *
 * Supports text-to-video, image-to-video, and video-to-video generation.
 * Video generation is asynchronous and requires polling for results.
 */

import { z } from 'zod';

import {
  alibabaSettingsSchema,
  klingAISettingsSchema,
  pixVerseSettingsSchema,
  veoSettingsSchema,
  syncSettingsSchema,
} from '../../shared/provider-settings.js';
import {
  cfgScaleSchema,
  imageInputSchema,
  loraArraySchema,
  positivePromptSchema,
  seedSchema,
  videoDurationSchema,
  videoOutputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  fpsSchema,
} from '../../shared/validation.js';

// ============================================================================
// Frame Control Schemas
// ============================================================================

/**
 * Schema for frame position.
 */
export const framePositionSchema = z.union([
  z.literal('first'),
  z.literal('last'),
  z.number().int().min(0),
]);

/**
 * Schema for a constrained frame image.
 */
export const frameImageSchema = z.object({
  /**
   * Image to use for this frame.
   */
  inputImage: imageInputSchema,

  /**
   * Frame position: 'first', 'last', or frame number.
   */
  frame: framePositionSchema.optional(),
});

/**
 * Schema for speech/TTS configuration.
 */
export const speechConfigSchema = z.object({
  /**
   * Text to convert to speech.
   */
  text: z.string().min(1),

  /**
   * Voice identifier.
   */
  voice: z.string(),
});

/**
 * Schema for safety configuration.
 */
export const videoSafetyConfigSchema = z.object({
  /**
   * Content safety checking mode.
   * - none: No safety checking
   * - fast: Quick safety check
   * - full: Full frame-by-frame checking
   */
  mode: z.enum(['none', 'fast', 'full']).optional(),
});

// ============================================================================
// Main Input Schema
// ============================================================================

/**
 * Schema for video inference input.
 *
 * Video generation supports:
 * - Text-to-video: Provide only positivePrompt
 * - Image-to-video: Add frameImages with first frame
 * - Video-to-video: Add referenceVideos
 */
export const videoInferenceInputSchema = z.object({
  // ========================================================================
  // Required Parameters
  // ========================================================================

  /**
   * Text description of the desired video.
   */
  positivePrompt: positivePromptSchema,

  /**
   * Video model identifier in AIR format.
   */
  model: z.string(),

  /**
   * Video duration in seconds (1-10).
   */
  duration: videoDurationSchema,

  // ========================================================================
  // Dimensions
  // ========================================================================

  /**
   * Video width in pixels (256-1920, multiple of 8).
   */
  width: z.number().int().min(256).max(1920).optional(),

  /**
   * Video height in pixels (256-1080, multiple of 8).
   */
  height: z.number().int().min(256).max(1080).optional(),

  // ========================================================================
  // Quality Controls
  // ========================================================================

  /**
   * Frames per second (15-60).
   */
  fps: fpsSchema.optional(),

  /**
   * Number of denoising steps (10-50).
   */
  steps: z.number().int().min(10).max(50).optional(),

  /**
   * Classifier-Free Guidance scale (0-50).
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API parameter name
  CFGScale: cfgScaleSchema.optional(),

  /**
   * Random seed for reproducible generation.
   */
  seed: seedSchema,

  // ========================================================================
  // Frame Control
  // ========================================================================

  /**
   * Constrained frame images at specific positions.
   */
  frameImages: z.array(frameImageSchema).optional(),

  /**
   * Reference images for style/composition guidance.
   */
  referenceImages: z.array(imageInputSchema).max(4).optional(),

  /**
   * Reference videos for motion/style influence.
   */
  referenceVideos: z.array(z.string()).optional(),

  /**
   * Input audio files for audio-driven generation.
   */
  inputAudios: z.array(z.string()).optional(),

  // ========================================================================
  // Audio
  // ========================================================================

  /**
   * Text-to-speech configuration.
   */
  speech: speechConfigSchema.optional(),

  // ========================================================================
  // Style Adapters
  // ========================================================================

  /**
   * LoRA adapters for style customization.
   */
  lora: loraArraySchema.optional(),

  // ========================================================================
  // Provider-Specific Settings
  // ========================================================================

  /**
   * Alibaba (Wan) specific settings.
   */
  alibaba: alibabaSettingsSchema.optional(),

  /**
   * KlingAI specific settings.
   */
  klingai: klingAISettingsSchema.optional(),

  /**
   * PixVerse specific settings.
   */
  pixverse: pixVerseSettingsSchema.optional(),

  /**
   * Google Veo specific settings.
   */
  veo: veoSettingsSchema.optional(),

  /**
   * Sync.so specific settings.
   */
  sync: syncSettingsSchema.optional(),

  // ========================================================================
  // Output Configuration
  // ========================================================================

  /**
   * Video output format.
   */
  outputFormat: videoOutputFormatSchema.optional(),

  /**
   * Output quality (20-99).
   */
  outputQuality: outputQualitySchema.optional(),

  /**
   * How to return the generated video.
   */
  outputType: outputTypeSchema.optional(),

  // ========================================================================
  // Safety and Metadata
  // ========================================================================

  /**
   * Content safety configuration.
   */
  safety: videoSafetyConfigSchema.optional(),

  /**
   * Include cost information in response.
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated video inference input.
 */
export type VideoInferenceInput = z.infer<typeof videoInferenceInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for video inference output.
 */
export const videoInferenceOutputSchema = z.object({
  /**
   * Unique identifier for the generated video.
   */
  videoUUID: z.string(),

  /**
   * URL to the generated video.
   */
  videoURL: z.string().optional(),

  /**
   * Seed used for generation.
   */
  seed: z.number().optional(),

  /**
   * Cost of the generation (USD).
   */
  cost: z.number().optional(),

  /**
   * Number of polling attempts made.
   */
  pollingAttempts: z.number().optional(),

  /**
   * Total elapsed time in milliseconds.
   */
  elapsedMs: z.number().optional(),
});

/**
 * Type for video inference output.
 */
export type VideoInferenceOutput = z.infer<typeof videoInferenceOutputSchema>;
