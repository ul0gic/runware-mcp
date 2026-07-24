import { z } from 'zod';

import { uuidSchema } from '../../shared/validation.js';

export const mediaStorageInputSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('upload'),
    media: z.string().min(1).max(70_000_000),
  }),
  z.object({
    operation: z.literal('delete'),
    media: uuidSchema,
  }),
]);

export type MediaStorageInput = z.infer<typeof mediaStorageInputSchema>;
