/**
 * Schema definitions for the image background removal tool.
 *
 * Removes backgrounds from images, creating transparent PNGs.
 */

import { z } from 'zod';

import {
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
} from '../../shared/validation.js';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for alpha matting settings (RemBG 1.4 only).
 */
export const alphaMattingSettingsSchema = z.object({
  /**
   * Enable alpha matting for edge refinement.
   */
  alphaMatting: z.boolean().optional(),

  /**
   * Foreground threshold (1-255).
   * Higher values = more foreground retained.
   */
  alphaMattingForegroundThreshold: z.number().int().min(1).max(255).optional(),

  /**
   * Background threshold (1-255).
   * Higher values = more background removed.
   */
  alphaMattingBackgroundThreshold: z.number().int().min(1).max(255).optional(),

  /**
   * Edge erosion size (1-255).
   * Smooths edges of the mask.
   */
  alphaMattingErodeSize: z.number().int().min(1).max(255).optional(),
});

/**
 * Schema for background removal settings (RemBG 1.4 only).
 */
export const backgroundRemovalSettingsSchema = alphaMattingSettingsSchema.extend({
  /**
   * Custom background color as RGBA array.
   * Example: [255, 255, 255, 255] for white.
   */
  rgba: z.array(z.number().int().min(0).max(255)).length(4).optional(),

  /**
   * Post-process the mask for better accuracy.
   */
  postProcessMask: z.boolean().optional(),

  /**
   * Return only the mask (inverse).
   */
  returnOnlyMask: z.boolean().optional(),
});

/**
 * Schema for image background removal input.
 */
export const imageBackgroundRemovalInputSchema = z.object({
  /**
   * Image to process.
   * Accepts UUID, URL, base64, or data URI.
   */
  inputImage: imageInputSchema,

  /**
   * Background removal model.
   * Default: runware:109@1 (RemBG 1.4)
   */
  model: z.string().optional().default('runware:109@1'),

  /**
   * Advanced settings (RemBG 1.4 only).
   */
  settings: backgroundRemovalSettingsSchema.optional(),

  /**
   * How to return the processed image.
   */
  outputType: outputTypeSchema.optional(),

  /**
   * Image format for output.
   * Use PNG for transparency.
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
 * Type for validated background removal input.
 */
export type ImageBackgroundRemovalInput = z.infer<typeof imageBackgroundRemovalInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for background removal output.
 */
export const imageBackgroundRemovalOutputSchema = z.object({
  /**
   * Unique identifier for the processed image.
   */
  imageUUID: z.string(),

  /**
   * URL to the processed image.
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
 * Type for background removal output.
 */
export type ImageBackgroundRemovalOutput = z.infer<typeof imageBackgroundRemovalOutputSchema>;
