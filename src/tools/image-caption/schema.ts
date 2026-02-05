/**
 * Schema definitions for the image caption tool.
 *
 * Generates descriptive text prompts from images using vision-language models.
 */

import { z } from 'zod';

import { imageInputSchema } from '../../shared/validation.js';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for image caption input.
 */
export const imageCaptionInputSchema = z.object({
  /**
   * Image to analyze.
   * Accepts UUID, URL, base64, or data URI.
   */
  inputImage: imageInputSchema,

  /**
   * Caption model identifier.
   * Available models:
   * - runware:150@2 (LLaVA-1.6-Mistral-7B) - detailed descriptions
   * - runware:151@1 (OpenAI CLIP ViT-L/14) - semantic understanding
   * - runware:152@1 (Qwen2.5-VL-3B-Instruct)
   * - runware:152@2 (Qwen2.5-VL-7B-Instruct)
   */
  model: z.string().optional().default('runware:150@2'),

  /**
   * Optional prompt to guide the analysis.
   * When omitted, provides a comprehensive description.
   */
  prompt: z.string().optional(),

  /**
   * Include cost information in response.
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated image caption input.
 */
export type ImageCaptionInput = z.infer<typeof imageCaptionInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for image caption output.
 */
export const imageCaptionOutputSchema = z.object({
  /**
   * Generated caption/description text.
   */
  text: z.string(),

  /**
   * Structured data for specialized models (e.g., age detection).
   */
  structuredData: z.record(z.string(), z.unknown()).optional(),

  /**
   * Cost of the operation (USD).
   */
  cost: z.number().optional(),
});

/**
 * Type for image caption output.
 */
export type ImageCaptionOutput = z.infer<typeof imageCaptionOutputSchema>;
