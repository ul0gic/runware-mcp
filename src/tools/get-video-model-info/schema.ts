import { z } from 'zod';

export const getVideoModelInfoInputSchema = z.object({
  /** AIR-format model identifier, e.g. "klingai:1.5@2". */
  modelId: z.string(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const getVideoModelInfoOutputSchema = z.object({
  id: z.string(),

  name: z.string(),

  provider: z.string(),

  maxWidth: z.number(),

  maxHeight: z.number(),

  /** Minimum video duration in seconds. */
  minDuration: z.number(),

  /** Maximum video duration in seconds. */
  maxDuration: z.number(),

  supportsFPS: z.boolean(),

  defaultFPS: z.number().optional(),

  supportsAudio: z.boolean(),

  supportsImageInput: z.boolean(),

  supportsVideoInput: z.boolean(),

  features: z.array(z.string()),

  /** Estimated USD per second of video. */
  costPerSecond: z.number().optional(),

  notes: z.string().optional(),
});

export type GetVideoModelInfoOutput = z.infer<typeof getVideoModelInfoOutputSchema>;
