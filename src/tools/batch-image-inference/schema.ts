import { z } from 'zod';

import {
  cfgScaleSchema,
  concurrencySchema,
  dimensionSchema,
  modelIdentifierSchema,
  negativePromptSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  positivePromptSchema,
  stepsSchema,
} from '../../shared/validation.js';

export const batchImageInferenceInputSchema = z.object({
  /** Each prompt produces exactly one image. */
  prompts: z
    .array(positivePromptSchema)
    .min(1, 'Must provide at least 1 prompt')
    .max(20, 'Cannot process more than 20 prompts'),

  model: modelIdentifierSchema,

  /** Width in pixels. */
  width: dimensionSchema.optional().default(1024),

  /** Height in pixels. */
  height: dimensionSchema.optional().default(1024),

  steps: stepsSchema.optional(),

  /** Classifier-Free Guidance scale. */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API parameter name
  CFGScale: cfgScaleSchema.optional(),

  /** Applied to every prompt in the batch. */
  negativePrompt: negativePromptSchema,

  scheduler: z.string().optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  concurrency: concurrencySchema,

  /** When false, remaining prompts still run after a failure. */
  stopOnError: z.boolean().optional().default(false),

  includeCost: z.boolean().optional().default(true),
});

const batchImageResultSchema = z.object({
  imageUUID: z.string(),

  imageURL: z.string().optional(),

  imageBase64Data: z.string().optional(),

  imageDataURI: z.string().optional(),

  seed: z.number().optional(),
});

const batchPromptResultSchema = z.object({
  prompt: z.string(),

  index: z.number(),

  status: z.enum(['success', 'failed']),

  images: z.array(batchImageResultSchema).optional(),

  error: z.string().optional(),

  /** Cost in USD. */
  cost: z.number().optional(),
});

export type BatchPromptResult = z.infer<typeof batchPromptResultSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const batchImageInferenceOutputSchema = z.object({
  total: z.number(),

  successful: z.number(),

  failed: z.number(),

  results: z.array(batchPromptResultSchema),

  /** Total cost in USD. */
  totalCost: z.number().optional(),
});

export type BatchImageInferenceOutput = z.infer<typeof batchImageInferenceOutputSchema>;
