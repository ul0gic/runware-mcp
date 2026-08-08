import { z } from 'zod';

import { imageInputSchema } from '../../shared/validation.js';

export const imageCaptionInputSchema = z.object({
  /** Accepts an image UUID, URL, base64 payload, or data URI. */
  inputImage: imageInputSchema,

  /** Default is Qwen2.5-VL-7B; runware:151@1 (CLIP ViT-L/14) and runware:152@1 (Qwen2.5-VL-3B) also work. */
  model: z.string().optional().default('runware:152@2'),

  /** Guides the analysis; when omitted the model returns a comprehensive description. */
  prompt: z.string().optional(),

  includeCost: z.boolean().optional().default(true),
});

export type ImageCaptionInput = z.infer<typeof imageCaptionInputSchema>;

export const imageCaptionOutputSchema = z.object({
  text: z.string(),

  /** Populated only by specialized models such as age detection. */
  structuredData: z.record(z.string(), z.unknown()).optional(),

  /** Cost in USD. */
  cost: z.number().optional(),
});

export type ImageCaptionOutput = z.infer<typeof imageCaptionOutputSchema>;
