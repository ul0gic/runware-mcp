/**
 * Schema definitions for the get video model info tool.
 *
 * This is a local tool that returns detailed information
 * about a specific video model.
 */

import { z } from 'zod';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for get video model info input.
 */
export const getVideoModelInfoInputSchema = z.object({
  /**
   * Model identifier in AIR format (e.g., "klingai:1.5@2").
   */
  modelId: z.string(),
});

/**
 * Type for validated get video model info input.
 */
export type GetVideoModelInfoInput = z.infer<typeof getVideoModelInfoInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for get video model info output.
 */
export const getVideoModelInfoOutputSchema = z.object({
  /**
   * Model identifier.
   */
  id: z.string(),

  /**
   * Human-readable model name.
   */
  name: z.string(),

  /**
   * Provider name.
   */
  provider: z.string(),

  /**
   * Maximum output width.
   */
  maxWidth: z.number(),

  /**
   * Maximum output height.
   */
  maxHeight: z.number(),

  /**
   * Minimum video duration in seconds.
   */
  minDuration: z.number(),

  /**
   * Maximum video duration in seconds.
   */
  maxDuration: z.number(),

  /**
   * Whether model supports custom FPS.
   */
  supportsFPS: z.boolean(),

  /**
   * Default FPS if applicable.
   */
  defaultFPS: z.number().optional(),

  /**
   * Whether model supports audio generation.
   */
  supportsAudio: z.boolean(),

  /**
   * Whether model accepts image input.
   */
  supportsImageInput: z.boolean(),

  /**
   * Whether model accepts video input.
   */
  supportsVideoInput: z.boolean(),

  /**
   * Supported features.
   */
  features: z.array(z.string()),

  /**
   * Estimated cost per second of video.
   */
  costPerSecond: z.number().optional(),

  /**
   * Additional notes about the model.
   */
  notes: z.string().optional(),
});

/**
 * Type for get video model info output.
 */
export type GetVideoModelInfoOutput = z.infer<typeof getVideoModelInfoOutputSchema>;
