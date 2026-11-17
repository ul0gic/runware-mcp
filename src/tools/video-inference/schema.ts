// Does:  Validates videoInference input, including frame, reference, speech and provider settings.
// Holds: width and height must be multiples of 8, and at most 4 reference images are accepted.

import { z } from 'zod';

import {
  alibabaSettingsSchema,
  klingAISettingsSchema,
  pixVerseSettingsSchema,
  veoSettingsSchema,
  syncSettingsSchema,
} from '../../shared/provider-settings.js';
import {
  cfgScaleSchema,
  imageInputSchema,
  loraArraySchema,
  positivePromptSchema,
  seedSchema,
  videoDurationSchema,
  videoOutputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  fpsSchema,
} from '../../shared/validation.js';

const framePositionSchema = z.union([z.literal('first'), z.literal('last'), z.number().int().min(0)]);

const frameImageSchema = z.object({
  inputImage: imageInputSchema,

  frame: framePositionSchema.optional(),
});

const speechConfigSchema = z.object({
  text: z.string().min(1),

  voice: z.string(),
});

const videoSafetyConfigSchema = z.object({
  mode: z.enum(['none', 'fast', 'full']).optional(),
});

// Holds: There is no mode field; text, image or video-to-video follows from which inputs are present.
export const videoInferenceInputSchema = z.object({
  positivePrompt: positivePromptSchema,

  model: z.string(),

  // Holds: Only a global bound is checked here; each model's own duration range is enforced by the API.
  duration: videoDurationSchema,

  width: z.number().int().min(256).max(7680).multipleOf(8).optional(),

  height: z.number().int().min(256).max(4320).multipleOf(8).optional(),

  fps: fpsSchema.optional(),

  steps: z.number().int().min(10).max(50).optional(),

  CFGScale: cfgScaleSchema.optional(),

  seed: seedSchema,

  frameImages: z.array(frameImageSchema).optional(),

  referenceImages: z.array(imageInputSchema).max(4).optional(),

  referenceVideos: z.array(z.string()).optional(),

  inputAudios: z.array(z.string()).optional(),

  speech: speechConfigSchema.optional(),

  lora: loraArraySchema.optional(),

  alibaba: alibabaSettingsSchema.optional(),

  klingai: klingAISettingsSchema.optional(),

  pixverse: pixVerseSettingsSchema.optional(),

  veo: veoSettingsSchema.optional(),

  sync: syncSettingsSchema.optional(),

  outputFormat: videoOutputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  outputType: outputTypeSchema.optional(),

  safety: videoSafetyConfigSchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

const videoInferenceOutputSchema = z.object({
  videoUUID: z.string(),

  videoURL: z.string().optional(),

  seed: z.number().optional(),

  cost: z.number().optional(),

  pollingAttempts: z.number().optional(),

  elapsedMs: z.number().optional(),
});

export type VideoInferenceOutput = z.infer<typeof videoInferenceOutputSchema>;
