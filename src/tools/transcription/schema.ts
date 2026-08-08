import { z } from 'zod';

export const transcriptionInputSchema = z.object({
  /** UUID or URL of a video file — MP4, M4V, or QuickTime only. */
  inputMedia: z.string().min(1),

  model: z.string().optional().default('memories:1@1'),

  /** ISO 639-1 code; omit for auto-detection. */
  language: z.string().length(2).optional(),

  includeCost: z.boolean().optional().default(true),
});

export type TranscriptionInput = z.infer<typeof transcriptionInputSchema>;

export const transcriptionOutputSchema = z.object({
  text: z.string(),

  structuredData: z.record(z.string(), z.unknown()).optional(),

  cost: z.number().optional(),

  pollingAttempts: z.number().optional(),

  elapsedMs: z.number().optional(),
});

export type TranscriptionOutput = z.infer<typeof transcriptionOutputSchema>;
