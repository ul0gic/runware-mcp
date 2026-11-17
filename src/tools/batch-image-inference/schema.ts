// Does:  Validates batchImageInference input and describes its per-prompt results.
// Holds: A batch holds 1-20 prompts, and every prompt shares one model, size and negative prompt.

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
  prompts: z
    .array(positivePromptSchema)
    .min(1, 'Must provide at least 1 prompt')
    .max(20, 'Cannot process more than 20 prompts'),

  model: modelIdentifierSchema,

  width: dimensionSchema.optional().default(1024),

  height: dimensionSchema.optional().default(1024),

  steps: stepsSchema.optional(),

  CFGScale: cfgScaleSchema.optional(),

  negativePrompt: negativePromptSchema,

  scheduler: z.string().optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  concurrency: concurrencySchema,

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

  cost: z.number().optional(),
});

export type BatchPromptResult = z.infer<typeof batchPromptResultSchema>;

const batchImageInferenceOutputSchema = z.object({
  total: z.number(),

  successful: z.number(),

  failed: z.number(),

  results: z.array(batchPromptResultSchema),

  totalCost: z.number().optional(),
});

export type BatchImageInferenceOutput = z.infer<typeof batchImageInferenceOutputSchema>;
