/**
 * Schema definitions for the image masking tool.
 *
 * Detects and generates masks for specific elements in images
 * (faces, hands, facial features, person segmentation).
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
 * Schema for image masking input.
 */
export const imageMaskingInputSchema = z.object({
  /**
   * Image to analyze.
   * Accepts UUID, URL, base64, or data URI.
   */
  inputImage: imageInputSchema,

  /**
   * Masking model identifier.
   * See constants/masking-models.ts for available models.
   * Default: runware:35@1 (face_yolov8n)
   */
  model: z.string().optional().default('runware:35@1'),

  /**
   * Confidence threshold for detections (0-1).
   * Lower values = more detections, higher = more accurate.
   */
  confidence: z.number().min(0).max(1).optional().default(0.25),

  /**
   * Maximum number of elements to detect (1-20).
   */
  maxDetections: z.number().int().min(1).max(20).optional().default(6),

  /**
   * Extend or reduce mask area in pixels.
   * Positive = extend, negative = shrink.
   */
  maskPadding: z.number().int().optional().default(4),

  /**
   * Fade-out effect at mask edges in pixels.
   */
  maskBlur: z.number().int().min(0).optional().default(4),

  /**
   * How to return the mask image.
   */
  outputType: outputTypeSchema.optional(),

  /**
   * Image format for the mask.
   */
  outputFormat: outputFormatSchema.optional(),

  /**
   * Output quality (20-99).
   */
  outputQuality: outputQualitySchema.optional(),

  /**
   * Include cost information in response.
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated image masking input.
 */
export type ImageMaskingInput = z.infer<typeof imageMaskingInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for a single detection bounding box.
 * Property names match API response format.
 */
export const detectionBoxSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  x_min: z.number(),
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  y_min: z.number(),
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  x_max: z.number(),
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  y_max: z.number(),
});

/**
 * Schema for image masking output.
 */
export const imageMaskingOutputSchema = z.object({
  /**
   * UUID of the original input image.
   */
  inputImageUUID: z.string().optional(),

  /**
   * UUID of the generated mask image.
   */
  maskImageUUID: z.string(),

  /**
   * URL to the mask image.
   */
  maskImageURL: z.string().optional(),

  /**
   * Base64-encoded mask image.
   */
  maskImageBase64Data: z.string().optional(),

  /**
   * Data URI of the mask image.
   */
  maskImageDataURI: z.string().optional(),

  /**
   * Array of detection bounding boxes.
   */
  detections: z.array(detectionBoxSchema),

  /**
   * Cost of the operation (USD).
   */
  cost: z.number().optional(),
});

/**
 * Type for image masking output.
 */
export type ImageMaskingOutput = z.infer<typeof imageMaskingOutputSchema>;
