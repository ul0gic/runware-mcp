// Does:  Validates getVideoModelInfo input and describes the model record it returns.
// Holds: Output arrays are copies, so callers can never mutate the bundled catalog through a result.

import { z } from 'zod';

export const getVideoModelInfoInputSchema = z.object({
  modelId: z.string(),
});

const getVideoModelInfoOutputSchema = z.object({
  id: z.string(),

  name: z.string(),

  provider: z.string(),

  maxWidth: z.number(),

  maxHeight: z.number(),

  minDuration: z.number(),

  maxDuration: z.number(),

  supportsFPS: z.boolean(),

  defaultFPS: z.number().optional(),

  supportsAudio: z.boolean(),

  supportsImageInput: z.boolean(),

  supportsVideoInput: z.boolean(),

  features: z.array(z.string()),

  costPerSecond: z.number().optional(),

  notes: z.string().optional(),
});

export type GetVideoModelInfoOutput = z.infer<typeof getVideoModelInfoOutputSchema>;
