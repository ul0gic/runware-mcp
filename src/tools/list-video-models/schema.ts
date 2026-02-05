/**
 * Schema definitions for the list video models tool.
 *
 * This is a local tool that returns video model information
 * from the constants, without making an API call.
 */

import { z } from 'zod';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for list video models input.
 */
export const listVideoModelsInputSchema = z.object({
  /**
   * Filter by provider name.
   */
  provider: z.enum([
    'klingai',
    'google',
    'minimax',
    'pixverse',
    'vidu',
    'alibaba',
    'runway',
    'seedance',
    'sync',
  ]).optional(),

  /**
   * Filter by minimum duration support.
   */
  minDuration: z.number().min(1).max(60).optional(),

  /**
   * Filter to models that support audio.
   */
  supportsAudio: z.boolean().optional(),

  /**
   * Filter to models that support image input.
   */
  supportsImageInput: z.boolean().optional(),

  /**
   * Filter to models that support video input.
   */
  supportsVideoInput: z.boolean().optional(),

  /**
   * Filter by specific feature.
   */
  feature: z.string().optional(),

  /**
   * Filter by minimum resolution (width).
   */
  minWidth: z.number().int().min(256).optional(),

  /**
   * Filter by minimum resolution (height).
   */
  minHeight: z.number().int().min(256).optional(),
});

/**
 * Type for validated list video models input.
 */
export type ListVideoModelsInput = z.infer<typeof listVideoModelsInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for a video model summary.
 */
export const videoModelSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  maxWidth: z.number(),
  maxHeight: z.number(),
  minDuration: z.number(),
  maxDuration: z.number(),
  supportsAudio: z.boolean(),
  supportsImageInput: z.boolean(),
  supportsVideoInput: z.boolean(),
  features: z.array(z.string()),
  costPerSecond: z.number().optional(),
});

/**
 * Schema for list video models output.
 */
export const listVideoModelsOutputSchema = z.object({
  /**
   * Array of matching video models.
   */
  models: z.array(videoModelSummarySchema),

  /**
   * Total count of matching models.
   */
  count: z.number(),

  /**
   * Available providers in the results.
   */
  providers: z.array(z.string()),
});

/**
 * Type for list video models output.
 */
export type ListVideoModelsOutput = z.infer<typeof listVideoModelsOutputSchema>;
