// Does:  Validates imageCaption input and describes its output.
// Holds: inputImage must pass the shared image-input check before any request is built.

import { z } from 'zod';

import { imageInputSchema } from '../../shared/validation.js';

export const imageCaptionInputSchema = z.object({
  inputImage: imageInputSchema,

  model: z.string().optional().default('runware:152@2'),

  prompt: z.string().optional(),

  includeCost: z.boolean().optional().default(true),
});

const imageCaptionOutputSchema = z.object({
  text: z.string(),

  structuredData: z.record(z.string(), z.unknown()).optional(),

  cost: z.number().optional(),
});

export type ImageCaptionOutput = z.infer<typeof imageCaptionOutputSchema>;
