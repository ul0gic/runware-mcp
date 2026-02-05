/**
 * Schema definitions for the style transfer tool.
 *
 * Defines input and output schemas for applying artistic styles
 * to images using img2img generation. This is a composite tool
 * that orchestrates imageCaption and imageInference.
 */

import { z } from 'zod';

import {
  dimensionSchema,
  imageInputSchema,
  outputFormatSchema,
  outputTypeSchema,
  stepsSchema,
  strengthSchema,
} from '../../shared/validation.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Available art styles for style transfer.
 */
export const ART_STYLES = [
  'oil-painting',
  'watercolor',
  'pencil-sketch',
  'pop-art',
  'impressionist',
  'cyberpunk',
  'studio-ghibli',
  'art-deco',
  'minimalist',
  'surrealist',
] as const;

/**
 * Intensity levels controlling stylization strength.
 */
export const INTENSITY_LEVELS = ['subtle', 'moderate', 'strong'] as const;

/**
 * Color palette options for guiding color temperature.
 */
export const COLOR_PALETTES = ['warm', 'cool', 'monochrome', 'vibrant', 'pastel'] as const;

// ============================================================================
// Enum Schemas
// ============================================================================

/**
 * Schema for art style values.
 */
export const artStyleSchema = z.enum(ART_STYLES);

/**
 * Type for art style values.
 */
export type ArtStyle = z.infer<typeof artStyleSchema>;

/**
 * Schema for intensity level values.
 */
export const intensitySchema = z.enum(INTENSITY_LEVELS);

/**
 * Type for intensity level values.
 */
export type Intensity = z.infer<typeof intensitySchema>;

/**
 * Schema for color palette values.
 */
export const colorPaletteSchema = z.enum(COLOR_PALETTES);

/**
 * Type for color palette values.
 */
export type ColorPalette = z.infer<typeof colorPaletteSchema>;

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for style transfer input.
 */
export const styleTransferInputSchema = z.object({
  /**
   * Source image to apply the style to.
   * Accepts UUID, URL, base64, or data URI.
   */
  inputImage: imageInputSchema,

  /**
   * Artistic style to apply.
   */
  style: artStyleSchema,

  /**
   * Text description of the image subject.
   * If not provided, the image will be auto-captioned.
   */
  subject: z.string().min(2).max(500).optional(),

  /**
   * Stylization intensity.
   * - subtle: preserves original clarity (CFGScale 5)
   * - moderate: balanced blend (CFGScale 7)
   * - strong: style dominates (CFGScale 10)
   * Default: moderate
   */
  intensity: intensitySchema.optional().default('moderate'),

  /**
   * Color palette to guide the output.
   * Default: vibrant
   */
  colorPalette: colorPaletteSchema.optional().default('vibrant'),

  /**
   * Model identifier for image generation.
   * Default: runware:100@1
   */
  model: z.string().optional().default('runware:100@1'),

  /**
   * Output image width in pixels (512-2048, multiple of 64).
   */
  width: dimensionSchema.optional(),

  /**
   * Output image height in pixels (512-2048, multiple of 64).
   */
  height: dimensionSchema.optional(),

  /**
   * Number of diffusion steps (1-100).
   */
  steps: stepsSchema.optional(),

  /**
   * Img2img denoising strength (0-1).
   * Lower values preserve more of the original image.
   * Default: 0.65
   */
  strength: strengthSchema.optional().default(0.65),

  /**
   * How to return the generated image.
   */
  outputType: outputTypeSchema.optional(),

  /**
   * Image format for output.
   */
  outputFormat: outputFormatSchema.optional(),

  /**
   * Include cost information in response.
   * Default: true
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated style transfer input.
 */
export type StyleTransferInput = z.infer<typeof styleTransferInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for style transfer output.
 */
export const styleTransferOutputSchema = z.object({
  /**
   * UUID of the generated styled image.
   */
  imageUUID: z.string(),

  /**
   * URL to the generated image (if outputType is URL).
   */
  imageURL: z.string().optional(),

  /**
   * The art style that was applied.
   */
  style: artStyleSchema,

  /**
   * The full prompt used for generation.
   */
  prompt: z.string(),

  /**
   * Caption text if auto-captioning was used.
   */
  captionUsed: z.string().optional(),

  /**
   * Total cost of the operation (caption + generation) in USD.
   */
  cost: z.number().optional(),
});

/**
 * Type for style transfer output.
 */
export type StyleTransferOutput = z.infer<typeof styleTransferOutputSchema>;
