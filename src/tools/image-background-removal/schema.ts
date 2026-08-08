import { z } from 'zod';

import {
  imageInputSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
} from '../../shared/validation.js';

const alphaMattingSettingsSchema = z.object({
  alphaMatting: z.boolean().optional(),

  /** Higher values retain more foreground. */
  alphaMattingForegroundThreshold: z.number().int().min(1).max(255).optional(),

  /** Higher values remove more background. */
  alphaMattingBackgroundThreshold: z.number().int().min(1).max(255).optional(),

  /** Smooths the edges of the mask. */
  alphaMattingErodeSize: z.number().int().min(1).max(255).optional(),
});

const backgroundRemovalSettingsSchema = alphaMattingSettingsSchema.extend({
  /** Background colour channels, e.g. [255, 255, 255, 255] for opaque white. */
  rgba: z.array(z.number().int().min(0).max(255)).length(4).optional(),

  postProcessMask: z.boolean().optional(),

  /** Returns the mask instead of the cut-out image. */
  returnOnlyMask: z.boolean().optional(),
});

export const imageBackgroundRemovalInputSchema = z.object({
  /** Accepts an image UUID, URL, base64 payload, or data URI. */
  inputImage: imageInputSchema,

  model: z.string().optional().default('runware:109@1'),

  /** Supported by RemBG 1.4 (runware:109@1) only. */
  settings: backgroundRemovalSettingsSchema.optional(),

  outputType: outputTypeSchema.optional(),

  /** PNG is required for transparency. */
  outputFormat: outputFormatSchema.optional(),

  /** Applies to JPG and WebP only. */
  outputQuality: outputQualitySchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const imageBackgroundRemovalOutputSchema = z.object({
  imageUUID: z.string(),

  imageURL: z.string().optional(),

  imageBase64Data: z.string().optional(),

  imageDataURI: z.string().optional(),

  /** Cost in USD. */
  cost: z.number().optional(),
});

export type ImageBackgroundRemovalOutput = z.infer<typeof imageBackgroundRemovalOutputSchema>;
