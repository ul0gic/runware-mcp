import { z } from 'zod';

import {
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  upscaleFactorSchema,
} from '../../shared/validation.js';

export const imageUpscaleInputSchema = z.object({
  /** Maximum input size: 1,048,576 pixels (1024x1024). */
  inputImage: imageInputSchema,

  /** Only SwinIR and Real-ESRGAN support 4x. */
  upscaleFactor: upscaleFactorSchema.optional().default(2),

  /** Clarity Upscaler (runware:xxx@1), SwinIR (@2), Real-ESRGAN (@3); @2 and @3 support 4x. */
  model: z.string().optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

export type ImageUpscaleInput = z.infer<typeof imageUpscaleInputSchema>;

export const imageUpscaleOutputSchema = z.object({
  imageUUID: z.string(),

  imageURL: z.string().optional(),

  imageBase64Data: z.string().optional(),

  imageDataURI: z.string().optional(),

  cost: z.number().optional(),
});

export type ImageUpscaleOutput = z.infer<typeof imageUpscaleOutputSchema>;
