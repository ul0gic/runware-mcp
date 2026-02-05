/**
 * Schema definitions for the image upload tool.
 *
 * Uploads images to Runware for use in subsequent operations.
 */

import { z } from 'zod';

import { filePathSchema, imageInputSchema } from '../../shared/validation.js';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for image upload input.
 *
 * Accepts one of: file path, base64 data, URL, or data URI.
 * Images are automatically resized to max 2048px in either dimension.
 */
export const imageUploadInputSchema = z.object({
  /**
   * Local file path to the image.
   * Must be an absolute path.
   */
  filePath: filePathSchema.optional(),

  /**
   * Base64-encoded image data.
   */
  base64: z.string().optional(),

  /**
   * URL to the image.
   */
  url: z.url().optional(),

  /**
   * Data URI with base64 image.
   */
  dataUri: z.string().optional(),

  /**
   * Generic image input (UUID, URL, base64, or data URI).
   * Alternative to the specific fields above.
   */
  image: imageInputSchema.optional(),
}).refine(
  (data) => {
    // At least one source must be provided
    return data.filePath !== undefined
      || data.base64 !== undefined
      || data.url !== undefined
      || data.dataUri !== undefined
      || data.image !== undefined;
  },
  { message: 'At least one image source (filePath, base64, url, dataUri, or image) must be provided' },
);

/**
 * Type for validated image upload input.
 */
export type ImageUploadInput = z.infer<typeof imageUploadInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for image upload output.
 */
export const imageUploadOutputSchema = z.object({
  /**
   * UUID assigned to the uploaded image.
   * Use this UUID in subsequent operations.
   */
  imageUUID: z.string(),
});

/**
 * Type for image upload output.
 */
export type ImageUploadOutput = z.infer<typeof imageUploadOutputSchema>;
