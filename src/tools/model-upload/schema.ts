import { z } from 'zod';

import { inferenceParametersSchema } from '../run-inference/schema.js';

const httpsUrlSchema = z.url().refine(
  (value) => new URL(value).protocol === 'https:',
  { message: 'URL must use HTTPS' },
);

export const modelUploadInputSchema = z.object({
  category: z.enum(['checkpoint', 'lora', 'lycoris', 'vae', 'embeddings']),
  architecture: z.string().min(1),
  format: z.literal('safetensors').optional().default('safetensors'),
  name: z.string().min(1).max(200),
  version: z.string().min(1).max(100),
  downloadURL: httpsUrlSchema,
  private: z.boolean().optional().default(true),
  air: z.string().min(1).optional(),
  uniqueIdentifier: z.string().min(1).max(200).optional(),
  heroImageURL: httpsUrlSchema.optional(),
  tags: z.array(z.string().min(1).max(100)).max(50).optional(),
  shortDescription: z.string().max(500).optional(),
  comment: z.string().max(2000).optional(),
  type: z.enum(['base', 'inpainting', 'positive', 'negative']).optional(),
  defaults: inferenceParametersSchema.optional().default({}),
});

export type ModelUploadInput = z.infer<typeof modelUploadInputSchema>;
