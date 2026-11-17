// Does:  Validates imageBackgroundRemoval input, including alpha-matting settings.
// Holds: Matting thresholds are bounded to 1-255, and rgba must be exactly four 0-255 channels.

import { z } from 'zod';

import {
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
} from '../../shared/validation.js';

const alphaMattingSettingsSchema = z.object({
  alphaMatting: z.boolean().optional(),

  alphaMattingForegroundThreshold: z.number().int().min(1).max(255).optional(),

  alphaMattingBackgroundThreshold: z.number().int().min(1).max(255).optional(),

  alphaMattingErodeSize: z.number().int().min(1).max(255).optional(),
});

const backgroundRemovalSettingsSchema = alphaMattingSettingsSchema.extend({
  rgba: z.array(z.number().int().min(0).max(255)).length(4).optional(),

  postProcessMask: z.boolean().optional(),

  returnOnlyMask: z.boolean().optional(),
});

export const imageBackgroundRemovalInputSchema = z.object({
  inputImage: imageInputSchema,

  model: z.string().optional().default('runware:109@1'),

  // Holds: Only RemBG 1.4 (runware:109@1) honours these settings; other models reject or ignore them.
  settings: backgroundRemovalSettingsSchema.optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

const imageBackgroundRemovalOutputSchema = z.object({
  imageUUID: z.string(),

  imageURL: z.string().optional(),

  imageBase64Data: z.string().optional(),

  imageDataURI: z.string().optional(),

  cost: z.number().optional(),
});

export type ImageBackgroundRemovalOutput = z.infer<typeof imageBackgroundRemovalOutputSchema>;
