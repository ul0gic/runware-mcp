/**
 * Schema definitions for the audio inference tool.
 *
 * Audio inference generates music, sound effects, speech, and ambient audio
 * from text prompts using ElevenLabs and Mirelo models.
 */

import { z } from 'zod';

import { audioDurationSchema, outputTypeSchema } from '../../shared/validation.js';

// ============================================================================
// Audio Output Format Schema
// ============================================================================

/**
 * Audio output format options.
 */
export const AUDIO_OUTPUT_FORMATS = ['MP3', 'WAV', 'OGG'] as const;

/**
 * Schema for audio output format.
 */
export const audioOutputFormatSchema = z.enum(AUDIO_OUTPUT_FORMATS);

// ============================================================================
// Audio Type Schema
// ============================================================================

/**
 * Audio type options.
 */
export const AUDIO_TYPES = ['music', 'sfx', 'speech', 'ambient'] as const;

/**
 * Schema for audio type.
 */
export const audioTypeSchema = z.enum(AUDIO_TYPES);

// ============================================================================
// Composition Plan Schema
// ============================================================================

/**
 * Schema for a single composition section (ElevenLabs feature).
 */
export const compositionSectionSchema = z.object({
  /**
   * Section name/label.
   */
  name: z.string().min(1).max(100),

  /**
   * Start time in seconds.
   */
  startTime: z.number().min(0),

  /**
   * End time in seconds.
   */
  endTime: z.number().min(0),

  /**
   * Optional prompt override for this section.
   */
  prompt: z.string().max(500).optional(),

  /**
   * Optional lyrics for this section.
   */
  lyrics: z.string().max(2000).optional(),
});

/**
 * Schema for ElevenLabs composition plan.
 * Allows structured music composition with sections, timing, and lyrics.
 */
export const compositionPlanSchema = z.object({
  /**
   * Global style for the composition.
   */
  globalStyle: z.string().max(200).optional(),

  /**
   * Array of composition sections.
   */
  sections: z.array(compositionSectionSchema).min(1).max(10),
});

// ============================================================================
// Audio Settings Schema
// ============================================================================

/**
 * Schema for audio quality settings.
 */
export const audioSettingsSchema = z.object({
  /**
   * Sample rate in Hz (8000-48000).
   */
  sampleRate: z.number().int().min(8000).max(48_000).optional(),

  /**
   * Bitrate in kbps (32-320).
   */
  bitrate: z.number().int().min(32).max(320).optional(),
});

// ============================================================================
// Provider Settings Schemas
// ============================================================================

/**
 * ElevenLabs provider-specific settings.
 */
export const elevenLabsSettingsSchema = z.object({
  /**
   * Composition plan for structured music generation.
   */
  compositionPlan: compositionPlanSchema.optional(),
});

/**
 * Mirelo provider-specific settings.
 */
export const mireloSettingsSchema = z.object({
  /**
   * Start offset in seconds for video-synchronized audio.
   */
  startOffset: z.number().min(0).optional(),
});

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for audio inference input.
 */
export const audioInferenceInputSchema = z.object({
  /**
   * Text description of the desired audio.
   * For music: describe the genre, mood, instruments, tempo.
   * For SFX: describe the sound effect.
   * For speech: provide the text to synthesize.
   */
  positivePrompt: z.string().min(2).max(2000),

  /**
   * Audio model identifier (AIR format).
   * Examples: 'elevenlabs:1@1', 'mirelo:1@1'
   */
  model: z.string().min(1),

  /**
   * Audio duration in seconds (10-300).
   */
  duration: audioDurationSchema.optional().default(30),

  /**
   * Type of audio to generate.
   * Helps optimize the model selection and generation.
   */
  audioType: audioTypeSchema.optional(),

  /**
   * Voice for text-to-speech.
   * Only applicable when generating speech.
   */
  voice: z.string().optional(),

  /**
   * Number of audio variations to generate (1-3).
   */
  numberResults: z.number().int().min(1).max(3).optional().default(1),

  /**
   * Audio quality settings.
   */
  audioSettings: audioSettingsSchema.optional(),

  /**
   * ElevenLabs-specific settings.
   */
  elevenlabs: elevenLabsSettingsSchema.optional(),

  /**
   * Mirelo-specific settings.
   */
  mirelo: mireloSettingsSchema.optional(),

  /**
   * How to return the generated audio.
   */
  outputType: outputTypeSchema.optional(),

  /**
   * Audio format for output.
   */
  outputFormat: audioOutputFormatSchema.optional(),

  /**
   * Include cost information in response.
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated audio inference input.
 */
export type AudioInferenceInput = z.infer<typeof audioInferenceInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for a single audio result.
 */
export const audioResultSchema = z.object({
  /**
   * Unique identifier for the generated audio.
   */
  audioUUID: z.string(),

  /**
   * URL to the generated audio.
   */
  audioURL: z.string().optional(),

  /**
   * Base64-encoded audio data.
   */
  audioBase64Data: z.string().optional(),

  /**
   * Data URI with base64 audio.
   */
  audioDataURI: z.string().optional(),
});

/**
 * Schema for audio inference output.
 */
export const audioInferenceOutputSchema = z.object({
  /**
   * Array of generated audio results.
   */
  results: z.array(audioResultSchema),

  /**
   * Total cost of the operation (USD).
   */
  cost: z.number().optional(),

  /**
   * Number of polling attempts (for async generation).
   */
  pollingAttempts: z.number().optional(),

  /**
   * Elapsed time in milliseconds.
   */
  elapsedMs: z.number().optional(),
});

/**
 * Type for audio inference output.
 */
export type AudioInferenceOutput = z.infer<typeof audioInferenceOutputSchema>;
