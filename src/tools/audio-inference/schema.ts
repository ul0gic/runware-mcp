// Does:  Validates audioInference input, including ElevenLabs composition plans and Mirelo offsets.
// Holds: Composition plans hold 1-10 sections; sample rate is bounded to 8-48 kHz and bitrate to 32-320 kbps.

import { z } from 'zod';

import { audioDurationSchema, outputTypeSchema } from '../../shared/validation.js';

const AUDIO_OUTPUT_FORMATS = ['MP3', 'WAV', 'OGG'] as const;

const audioOutputFormatSchema = z.enum(AUDIO_OUTPUT_FORMATS);

const AUDIO_TYPES = ['music', 'sfx', 'speech', 'ambient'] as const;

const audioTypeSchema = z.enum(AUDIO_TYPES);

const compositionSectionSchema = z.object({
  name: z.string().min(1).max(100),

  startTime: z.number().min(0),

  endTime: z.number().min(0),

  prompt: z.string().max(500).optional(),

  lyrics: z.string().max(2000).optional(),
});

const compositionPlanSchema = z.object({
  globalStyle: z.string().max(200).optional(),

  sections: z.array(compositionSectionSchema).min(1).max(10),
});

const audioSettingsSchema = z.object({
  sampleRate: z.number().int().min(8000).max(48_000).optional(),

  bitrate: z.number().int().min(32).max(320).optional(),
});

const elevenLabsSettingsSchema = z.object({
  compositionPlan: compositionPlanSchema.optional(),
});

const mireloSettingsSchema = z.object({
  startOffset: z.number().min(0).optional(),
});

export const audioInferenceInputSchema = z.object({
  positivePrompt: z.string().min(2).max(2000),

  model: z.string().min(1),

  duration: audioDurationSchema.optional().default(30),

  audioType: audioTypeSchema.optional(),

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

const audioResultSchema = z.object({
  audioUUID: z.string(),

  audioURL: z.string().optional(),

  audioBase64Data: z.string().optional(),

  audioDataURI: z.string().optional(),
});

const audioInferenceOutputSchema = z.object({
  results: z.array(audioResultSchema),

  cost: z.number().optional(),

  pollingAttempts: z.number().optional(),

  elapsedMs: z.number().optional(),
});

export type AudioInferenceOutput = z.infer<typeof audioInferenceOutputSchema>;
