/**
 * Schema definitions for the ControlNet preprocess tool.
 *
 * ControlNet preprocessing transforms input images into guide images
 * for controlled image generation. Supports 12 preprocessor types.
 */

import { z } from 'zod';

import {
  controlNetPreprocessorSchema,
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
} from '../../shared/validation.js';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for ControlNet preprocess input.
 */
export const controlNetPreprocessInputSchema = z.object({
  /**
   * Image to preprocess.
   * Accepts UUID, URL, base64, or data URI.
   */
  inputImage: imageInputSchema,

  /**
   * Preprocessing algorithm to use.
   * Each preprocessor creates a different type of guide image:
   * - canny: Edge detection
   * - depth: Depth map estimation
   * - mlsd: Line segment detection
   * - normalbae: Surface normal estimation
   * - openpose: Human pose estimation
   * - tile: Tile-based processing
   * - seg: Semantic segmentation
   * - lineart: Line art extraction
   * - lineart_anime: Anime-style line art
   * - shuffle: Content shuffling
   * - scribble: Rough sketch interpretation
   * - softedge: Soft edge detection
   */
  preprocessor: controlNetPreprocessorSchema,

  /**
   * Output image height (optional resize).
   */
  height: z.number().int().min(64).max(2048).optional(),

  /**
   * Output image width (optional resize).
   */
  width: z.number().int().min(64).max(2048).optional(),

  /**
   * Low threshold for Canny edge detection (0-255).
   * Only applicable when preprocessor is 'canny'.
   */
  lowThresholdCanny: z.number().int().min(0).max(255).optional(),

  /**
   * High threshold for Canny edge detection (0-255).
   * Only applicable when preprocessor is 'canny'.
   */
  highThresholdCanny: z.number().int().min(0).max(255).optional(),

  /**
   * Include detailed hand and face pose outlines.
   * Only applicable when preprocessor is 'openpose'.
   */
  includeHandsAndFaceOpenPose: z.boolean().optional(),

  /**
   * How to return the preprocessed image.
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
 * Type for validated ControlNet preprocess input.
 */
export type ControlNetPreprocessInput = z.infer<typeof controlNetPreprocessInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for ControlNet preprocess output.
 */
export const controlNetPreprocessOutputSchema = z.object({
  /**
   * Unique identifier for the preprocessed guide image.
   */
  guideImageUUID: z.string(),

  /**
   * Unique identifier for the original input image.
   */
  inputImageUUID: z.string().optional(),

  /**
   * URL to the preprocessed image.
   */
  guideImageURL: z.string().optional(),

  /**
   * Base64-encoded image data.
   */
  guideImageBase64Data: z.string().optional(),

  /**
   * Data URI with base64 image.
   */
  guideImageDataURI: z.string().optional(),

  /**
   * Cost of the operation (USD).
   */
  cost: z.number().optional(),
});

/**
 * Type for ControlNet preprocess output.
 */
export type ControlNetPreprocessOutput = z.infer<typeof controlNetPreprocessOutputSchema>;
