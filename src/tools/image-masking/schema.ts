import { z } from 'zod';

import {
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
} from '../../shared/validation.js';

export const imageMaskingInputSchema = z.object({
  /** Accepts an image UUID, URL, base64 payload, or data URI. */
  inputImage: imageInputSchema,

  /** Default is face_yolov8n; see constants/masking-models.ts for the full set. */
  model: z.string().optional().default('runware:35@1'),

  /** Lower values yield more detections, higher values fewer but more accurate ones. */
  confidence: z.number().min(0).max(1).optional().default(0.25),

  maxDetections: z.number().int().min(1).max(20).optional().default(6),

  /** Pixels added to the mask area; negative values shrink it. */
  maskPadding: z.number().int().optional().default(4),

  /** Edge fade-out in pixels. */
  maskBlur: z.number().int().min(0).optional().default(4),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

export type ImageMaskingInput = z.infer<typeof imageMaskingInputSchema>;

export const detectionBoxSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  x_min: z.number(),
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  y_min: z.number(),
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  x_max: z.number(),
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  y_max: z.number(),
});

export const imageMaskingOutputSchema = z.object({
  inputImageUUID: z.string().optional(),

  maskImageUUID: z.string(),

  maskImageURL: z.string().optional(),

  maskImageBase64Data: z.string().optional(),

  maskImageDataURI: z.string().optional(),

  detections: z.array(detectionBoxSchema),

  /** Cost in USD. */
  cost: z.number().optional(),
});

export type ImageMaskingOutput = z.infer<typeof imageMaskingOutputSchema>;
