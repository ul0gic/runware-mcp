// Does:  Validates imageMasking input and describes the mask and detections it returns.
// Holds: confidence is bounded to 0-1, maxDetections to 1-20, and maskBlur can never be negative.

import { z } from 'zod';

import {
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
} from '../../shared/validation.js';

export const imageMaskingInputSchema = z.object({
  inputImage: imageInputSchema,

  model: z.string().optional().default('runware:35@1'),

  confidence: z.number().min(0).max(1).optional().default(0.25),

  maxDetections: z.number().int().min(1).max(20).optional().default(6),

  // Why: Negative padding is valid and shrinks the mask, so this field has no lower bound.
  maskPadding: z.number().int().optional().default(4),

  maskBlur: z.number().int().min(0).optional().default(4),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

const detectionBoxSchema = z.object({
  x_min: z.number(),
  y_min: z.number(),
  x_max: z.number(),
  y_max: z.number(),
});

const imageMaskingOutputSchema = z.object({
  inputImageUUID: z.string().optional(),

  maskImageUUID: z.string(),

  maskImageURL: z.string().optional(),

  maskImageBase64Data: z.string().optional(),

  maskImageDataURI: z.string().optional(),

  detections: z.array(detectionBoxSchema),

  cost: z.number().optional(),
});

export type ImageMaskingOutput = z.infer<typeof imageMaskingOutputSchema>;
