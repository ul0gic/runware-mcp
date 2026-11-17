// Does:  Validates controlNetPreprocess input and describes its guide-image output.
// Holds: Resize dimensions are bounded to 64-2048 px and Canny thresholds to 0-255.

import { z } from 'zod';

import {
  controlNetPreprocessorSchema,
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
} from '../../shared/validation.js';

export const controlNetPreprocessInputSchema = z.object({
  inputImage: imageInputSchema,

  preprocessor: controlNetPreprocessorSchema,

  height: z.number().int().min(64).max(2048).optional(),

  width: z.number().int().min(64).max(2048).optional(),

  lowThresholdCanny: z.number().int().min(0).max(255).optional(),

  highThresholdCanny: z.number().int().min(0).max(255).optional(),

  includeHandsAndFaceOpenPose: z.boolean().optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

export type ControlNetPreprocessInput = z.infer<typeof controlNetPreprocessInputSchema>;

const controlNetPreprocessOutputSchema = z.object({
  guideImageUUID: z.string(),

  inputImageUUID: z.string().optional(),

  guideImageURL: z.string().optional(),

  guideImageBase64Data: z.string().optional(),

  guideImageDataURI: z.string().optional(),

  cost: z.number().optional(),
});

export type ControlNetPreprocessOutput = z.infer<typeof controlNetPreprocessOutputSchema>;
