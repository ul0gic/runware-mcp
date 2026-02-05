/**
 * Schema definitions for the vectorize tool.
 *
 * Vectorization converts raster images (PNG, JPG, WEBP) into
 * scalable vector graphics (SVG) for perfect clarity at any size.
 */

import { z } from 'zod';

import { imageInputSchema, outputTypeSchema } from '../../shared/validation.js';

// ============================================================================
// Vectorize Model Schema
// ============================================================================

/**
 * Available vectorization models.
 */
export const VECTORIZE_MODELS = ['recraft:1@1', 'picsart:1@1'] as const;

/**
 * Schema for vectorize model selection.
 */
export const vectorizeModelSchema = z.enum(VECTORIZE_MODELS);

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for vectorize input.
 */
export const vectorizeInputSchema = z.object({
  /**
   * Image to vectorize.
   * Accepts UUID, URL, base64, or data URI.
   * Supported formats: PNG, JPG, WEBP.
   */
  inputImage: imageInputSchema,

  /**
   * Vectorization model to use.
   * - recraft:1@1: Recraft Vectorize
   * - picsart:1@1: Picsart Image Vectorizer
   */
  model: vectorizeModelSchema.optional().default('recraft:1@1'),

  /**
   * How to return the vectorized image.
   */
  outputType: outputTypeSchema.optional(),

  /**
   * Output format (only SVG supported).
   */
  outputFormat: z.literal('SVG').optional().default('SVG'),

  /**
   * Include cost information in response.
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated vectorize input.
 */
export type VectorizeInput = z.infer<typeof vectorizeInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for vectorize output.
 */
export const vectorizeOutputSchema = z.object({
  /**
   * Unique identifier for the vectorized image.
   */
  imageUUID: z.string(),

  /**
   * URL to the vectorized SVG.
   */
  imageURL: z.string().optional(),

  /**
   * Base64-encoded SVG data.
   */
  imageBase64Data: z.string().optional(),

  /**
   * Data URI with base64 SVG.
   */
  imageDataURI: z.string().optional(),

  /**
   * Cost of the operation (USD).
   */
  cost: z.number().optional(),
});

/**
 * Type for vectorize output.
 */
export type VectorizeOutput = z.infer<typeof vectorizeOutputSchema>;
