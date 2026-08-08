import { z } from 'zod';

import { audioDurationSchema, outputTypeSchema } from '../../shared/validation.js';

export const AUDIO_OUTPUT_FORMATS = ['MP3', 'WAV', 'OGG'] as const;

export const audioOutputFormatSchema = z.enum(AUDIO_OUTPUT_FORMATS);

export const AUDIO_TYPES = ['music', 'sfx', 'speech', 'ambient'] as const;

export const audioTypeSchema = z.enum(AUDIO_TYPES);

/** Composition section for the ElevenLabs structured-music feature. */
export const compositionSectionSchema = z.object({
  name: z.string().min(1).max(100),

  /** Start time in seconds. */
  startTime: z.number().min(0),

  /** End time in seconds. */
  endTime: z.number().min(0),

  /** Overrides the top-level prompt for this section. */
  prompt: z.string().max(500).optional(),

  lyrics: z.string().max(2000).optional(),
});

/** ElevenLabs structured composition: ordered sections with timing and lyrics. */
export const compositionPlanSchema = z.object({
  globalStyle: z.string().max(200).optional(),

  sections: z.array(compositionSectionSchema).min(1).max(10),
});

export const audioSettingsSchema = z.object({
  /** Sample rate in Hz. */
  sampleRate: z.number().int().min(8000).max(48_000).optional(),

  /** Bitrate in kbps. */
  bitrate: z.number().int().min(32).max(320).optional(),
});

export const elevenLabsSettingsSchema = z.object({
  compositionPlan: compositionPlanSchema.optional(),
});

export const mireloSettingsSchema = z.object({
  /** Start offset in seconds for video-synchronized audio. */
  startOffset: z.number().min(0).optional(),
});

export const audioInferenceInputSchema = z.object({
  /** Describes the desired audio; for speech, the text to synthesize. */
  positivePrompt: z.string().min(2).max(2000),

  /** Audio model in AIR format, e.g. 'elevenlabs:1@1' or 'mirelo:1@1'. */
  model: z.string().min(1),

  /** Duration in seconds. */
  duration: audioDurationSchema.optional().default(30),

  audioType: audioTypeSchema.optional(),

  /** Only applicable when generating speech. */
  voice: z.string().optional(),

  numberResults: z.number().int().min(1).max(3).optional().default(1),

  audioSettings: audioSettingsSchema.optional(),

  elevenlabs: elevenLabsSettingsSchema.optional(),

  mirelo: mireloSettingsSchema.optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: audioOutputFormatSchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

export type AudioInferenceInput = z.infer<typeof audioInferenceInputSchema>;

export const audioResultSchema = z.object({
  audioUUID: z.string(),

  audioURL: z.string().optional(),

  audioBase64Data: z.string().optional(),

  audioDataURI: z.string().optional(),
});

export const audioInferenceOutputSchema = z.object({
  results: z.array(audioResultSchema),

  /** Cost in USD. */
  cost: z.number().optional(),

  pollingAttempts: z.number().optional(),

  elapsedMs: z.number().optional(),
});

export type AudioInferenceOutput = z.infer<typeof audioInferenceOutputSchema>;
