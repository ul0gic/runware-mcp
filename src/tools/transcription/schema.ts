/**
 * Schema definitions for the transcription tool.
 *
 * Transcription converts video content to text using the caption API
 * with the memories:1@1 model. Only video formats are supported
 * (MP4, M4V, QuickTime). The API is async and requires polling.
 */

import { z } from 'zod';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for transcription input.
 */
export const transcriptionInputSchema = z.object({
  /**
   * Video file to transcribe.
   * Accepts UUID or URL of a video file (MP4, M4V, QuickTime).
   */
  inputMedia: z.string().min(1),

  /**
   * Transcription model to use.
   * Default: memories:1@1
   */
  model: z.string().optional().default('memories:1@1'),

  /**
   * Language code for transcription (ISO 639-1).
   * Examples: 'en', 'es', 'fr', 'de', 'ja'
   * If not specified, auto-detection is used.
   */
  language: z.string().length(2).optional(),

  /**
   * Include cost information in response.
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated transcription input.
 */
export type TranscriptionInput = z.infer<typeof transcriptionInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for transcription output.
 */
export const transcriptionOutputSchema = z.object({
  /**
   * Full transcribed text.
   */
  text: z.string(),

  /**
   * Structured data from the model (if available).
   */
  structuredData: z.record(z.string(), z.unknown()).optional(),

  /**
   * Cost of the operation (USD).
   */
  cost: z.number().optional(),

  /**
   * Number of polling attempts made before the result was ready.
   */
  pollingAttempts: z.number().optional(),

  /**
   * Total elapsed time in milliseconds for the async operation.
   */
  elapsedMs: z.number().optional(),
});

/**
 * Type for transcription output.
 */
export type TranscriptionOutput = z.infer<typeof transcriptionOutputSchema>;
