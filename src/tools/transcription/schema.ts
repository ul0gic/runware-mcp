// Does:  Validates transcription input and describes its output.
// Holds: language, when given, must be exactly two characters (an ISO 639-1 code).

import { z } from 'zod';

export const transcriptionInputSchema = z.object({
  inputMedia: z.string().min(1),

  model: z.string().optional().default('memories:1@1'),

  language: z.string().length(2).optional(),

  includeCost: z.boolean().optional().default(true),
});

export type TranscriptionInput = z.infer<typeof transcriptionInputSchema>;

const transcriptionOutputSchema = z.object({
  text: z.string(),

  structuredData: z.record(z.string(), z.unknown()).optional(),

  cost: z.number().optional(),

  pollingAttempts: z.number().optional(),

  elapsedMs: z.number().optional(),
});

export type TranscriptionOutput = z.infer<typeof transcriptionOutputSchema>;
