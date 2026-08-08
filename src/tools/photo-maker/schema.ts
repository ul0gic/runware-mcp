import { z } from 'zod';

import {
  cfgScaleSchema,
  dimensionSchema,
  imageInputSchema,
  negativePromptSchema,
  numberResultsSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  positivePromptSchema,
  seedSchema,
  stepsSchema,
  strengthSchema,
} from '../../shared/validation.js';

export const photoMakerInputSchema = z.object({
  /** The "img" trigger word is auto-prepended if not present. */
  positivePrompt: positivePromptSchema,

  inputImages: z.array(imageInputSchema).min(1).max(4),

  model: z.string().optional().default('civitai:139562@344487'),

  width: dimensionSchema.optional().default(1024),

  height: dimensionSchema.optional().default(1024),

  steps: stepsSchema.optional(),

  // eslint-disable-next-line @typescript-eslint/naming-convention -- CFGScale is the Runware API parameter name
  CFGScale: cfgScaleSchema.optional(),

  seed: seedSchema,

  scheduler: z.string().optional(),

  numberResults: numberResultsSchema.optional().default(1),

  negativePrompt: negativePromptSchema,

  /** Lower values preserve identity more strictly; higher values allow more creative freedom. */
  styleStrength: z.number().min(0).max(1).optional().default(0.5),

  /** Higher values diverge further from the reference images. */
  strength: strengthSchema.optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

export type PhotoMakerInput = z.infer<typeof photoMakerInputSchema>;

export const photoMakerResultSchema = z.object({
  imageUUID: z.string(),

  imageURL: z.string().optional(),

  imageBase64Data: z.string().optional(),

  imageDataURI: z.string().optional(),

  seed: z.number().optional(),
});

export const photoMakerOutputSchema = z.object({
  images: z.array(photoMakerResultSchema),

  cost: z.number().optional(),
});

export type PhotoMakerOutput = z.infer<typeof photoMakerOutputSchema>;
