import { z } from 'zod';

export const textMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
});

export const textInferenceInputSchema = z.object({
  model: z.string().min(1),
  messages: z.array(textMessageSchema).min(1),
  inputs: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  outputFormat: z.string().optional().default('TEXT'),
  tools: z.array(z.record(z.string(), z.unknown())).optional(),
  toolChoice: z.record(z.string(), z.unknown()).optional(),
  numberResults: z.number().int().min(1).max(10).optional(),
  includeCost: z.boolean().optional().default(true),
  includeUsage: z.boolean().optional().default(true),
  deliveryMethod: z.enum(['sync', 'async']).optional().default('sync'),
});

export type TextInferenceInput = z.infer<typeof textInferenceInputSchema>;
