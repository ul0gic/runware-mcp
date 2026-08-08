import { z } from 'zod';

import { imageInputSchema, outputTypeSchema } from '../../shared/validation.js';

export const VECTORIZE_MODELS = ['recraft:1@1', 'picsart:1@1'] as const;

const vectorizeModelSchema = z.enum(VECTORIZE_MODELS);

export const vectorizeInputSchema = z.object({
  /** Raster source only — PNG, JPG, or WEBP. */
  inputImage: imageInputSchema,

  model: vectorizeModelSchema.optional().default('recraft:1@1'),

  outputType: outputTypeSchema.optional(),

  outputFormat: z.literal('SVG').optional().default('SVG'),

  includeCost: z.boolean().optional().default(true),
});

export type VectorizeInput = z.infer<typeof vectorizeInputSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const vectorizeOutputSchema = z.object({
  imageUUID: z.string(),

  imageURL: z.string().optional(),

  imageBase64Data: z.string().optional(),

  imageDataURI: z.string().optional(),

  cost: z.number().optional(),
});

export type VectorizeOutput = z.infer<typeof vectorizeOutputSchema>;
