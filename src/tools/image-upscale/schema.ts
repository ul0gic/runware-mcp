/**
 * Schema definitions for the image upscale tool.
 *
 * Upscaling enhances image resolution and quality.
 * Supports 2x and 4x upscale factors.
 */

import { z } from 'zod';

import {
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  upscaleFactorSchema,
} from '../../shared/validation.js';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for image upscale input.
 */
export const imageUpscaleInputSchema = z.object({
  /**
   * Image to upscale.
   * Accepts UUID, URL, base64, or data URI.
   * Maximum input size: 1,048,576 pixels (1024x1024).
   */
  inputImage: imageInputSchema,

  /**
   * Upscale factor (2 or 4).
   * Only SwinIR and Real-ESRGAN support 4x.
   */
  upscaleFactor: upscaleFactorSchema.optional().default(2),

  /**
   * Upscale model identifier.
   * Available models:
   * - runware:xxx@1 (Clarity Upscaler)
   * - runware:xxx@2 (SwinIR - supports 4x)
   * - runware:xxx@3 (Real-ESRGAN - supports 4x)
   */
  model: z.string().optional(),

  /**
   * How to return the upscaled image.
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
 * Type for validated image upscale input.
 */
export type ImageUpscaleInput = z.infer<typeof imageUpscaleInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for image upscale output.
 */
export const imageUpscaleOutputSchema = z.object({
  /**
   * Unique identifier for the upscaled image.
   */
  imageUUID: z.string(),

  /**
   * URL to the upscaled image.
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
   * Cost of the operation (USD).
   */
  cost: z.number().optional(),
});

/**
 * Type for image upscale output.
 */
export type ImageUpscaleOutput = z.infer<typeof imageUpscaleOutputSchema>;
