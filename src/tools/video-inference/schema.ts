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

const framePositionSchema = z.union([
  z.literal('first'),
  z.literal('last'),
  z.number().int().min(0),
]);

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

/**
 * Mode follows the inputs: prompt alone is text-to-video, plus frameImages is
 * image-to-video, plus referenceVideos is video-to-video.
 */
export const videoInferenceInputSchema = z.object({
  positivePrompt: positivePromptSchema,

  /** AIR-format identifier. */
  model: z.string(),

  /** Seconds; the accepted range is model-specific. */
  duration: videoDurationSchema,

  width: z.number().int().min(256).max(7680).multipleOf(8).optional(),

  height: z.number().int().min(256).max(4320).multipleOf(8).optional(),

  fps: fpsSchema.optional(),

  steps: z.number().int().min(10).max(50).optional(),

  // eslint-disable-next-line @typescript-eslint/naming-convention -- API parameter name
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const videoInferenceOutputSchema = z.object({
  videoUUID: z.string(),

  videoURL: z.string().optional(),

  seed: z.number().optional(),

  cost: z.number().optional(),

  pollingAttempts: z.number().optional(),

  elapsedMs: z.number().optional(),
});

export type VideoInferenceOutput = z.infer<typeof videoInferenceOutputSchema>;
