import { z } from 'zod';

import {
  controlNetPreprocessorSchema,
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
} from '../../shared/validation.js';

export const controlNetPreprocessInputSchema = z.object({
  /** Accepts an image UUID, URL, base64 payload, or data URI. */
  inputImage: imageInputSchema,

  preprocessor: controlNetPreprocessorSchema,

  /** Resizes the guide image when set. */
  height: z.number().int().min(64).max(2048).optional(),

  /** Resizes the guide image when set. */
  width: z.number().int().min(64).max(2048).optional(),

  /** Only applicable when preprocessor is 'canny'. */
  lowThresholdCanny: z.number().int().min(0).max(255).optional(),

  /** Only applicable when preprocessor is 'canny'. */
  highThresholdCanny: z.number().int().min(0).max(255).optional(),

  /** Only applicable when preprocessor is 'openpose'. */
  includeHandsAndFaceOpenPose: z.boolean().optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

export type ControlNetPreprocessInput = z.infer<typeof controlNetPreprocessInputSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const controlNetPreprocessOutputSchema = z.object({
  guideImageUUID: z.string(),

  inputImageUUID: z.string().optional(),

  guideImageURL: z.string().optional(),

  guideImageBase64Data: z.string().optional(),

  guideImageDataURI: z.string().optional(),

  /** Cost in USD. */
  cost: z.number().optional(),
});

export type ControlNetPreprocessOutput = z.infer<typeof controlNetPreprocessOutputSchema>;
