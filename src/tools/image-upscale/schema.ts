// Does:  Validates imageUpscale input and describes the upscaled image it returns.
// Holds: upscaleFactor is limited to 2 or 4 and defaults to 2.

import { z } from 'zod';

import {
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  upscaleFactorSchema,
} from '../../shared/validation.js';

export const imageUpscaleInputSchema = z.object({
  inputImage: imageInputSchema,

  // Holds: 4x is checked only by the API, which accepts it from SwinIR and Real-ESRGAN alone.
  upscaleFactor: upscaleFactorSchema.optional().default(2),

  model: z.string().optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

const imageUpscaleOutputSchema = z.object({
  imageUUID: z.string(),

  imageURL: z.string().optional(),

  imageBase64Data: z.string().optional(),

  imageDataURI: z.string().optional(),

  cost: z.number().optional(),
});

export type ImageUpscaleOutput = z.infer<typeof imageUpscaleOutputSchema>;
