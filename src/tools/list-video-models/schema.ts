import { z } from 'zod';

export const listVideoModelsInputSchema = z.object({
  provider: z.enum([
    'klingai',
    'google',
    'minimax',
    'pixverse',
    'vidu',
    'alibaba',
    'runway',
    'seedance',
    'sync',
  ]).optional(),

  minDuration: z.number().min(1).max(60).optional(),

  supportsAudio: z.boolean().optional(),

  supportsImageInput: z.boolean().optional(),

  supportsVideoInput: z.boolean().optional(),

  feature: z.string().optional(),

  minWidth: z.number().int().min(256).optional(),

  minHeight: z.number().int().min(256).optional(),
});

export type ListVideoModelsInput = z.infer<typeof listVideoModelsInputSchema>;

export const videoModelSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  maxWidth: z.number(),
  maxHeight: z.number(),
  minDuration: z.number(),
  maxDuration: z.number(),
  supportsAudio: z.boolean(),
  supportsImageInput: z.boolean(),
  supportsVideoInput: z.boolean(),
  features: z.array(z.string()),
  costPerSecond: z.number().optional(),
});

export const listVideoModelsOutputSchema = z.object({
  models: z.array(videoModelSummarySchema),

  count: z.number(),

  providers: z.array(z.string()),
});

export type ListVideoModelsOutput = z.infer<typeof listVideoModelsOutputSchema>;
