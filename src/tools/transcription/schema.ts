/**
 * Schema definitions for the transcription tool.
 *
 * Transcription converts video or audio content to text,
 * with optional timestamp segments.
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
   * Video or audio file to transcribe.
   * Accepts UUID or URL of a video/audio file.
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
 * Schema for a transcription segment with timestamps.
 */
export const transcriptionSegmentSchema = z.object({
  /**
   * Start time of the segment in seconds.
   */
  start: z.number(),

  /**
   * End time of the segment in seconds.
   */
  end: z.number(),

  /**
   * Transcribed text for this segment.
   */
  text: z.string(),
});

/**
 * Schema for transcription output.
 */
export const transcriptionOutputSchema = z.object({
  /**
   * Full transcribed text.
   */
  text: z.string(),

  /**
   * Array of timestamped segments (if available).
   */
  segments: z.array(transcriptionSegmentSchema).optional(),

  /**
   * Detected language (ISO 639-1 code).
   */
  detectedLanguage: z.string().optional(),

  /**
   * Cost of the operation (USD).
   */
  cost: z.number().optional(),

  /**
   * Number of polling attempts (if async).
   */
  pollingAttempts: z.number().optional(),

  /**
   * Elapsed time in milliseconds.
   */
  elapsedMs: z.number().optional(),
});

/**
 * Type for transcription output.
 */
export type TranscriptionOutput = z.infer<typeof transcriptionOutputSchema>;
