import { z } from 'zod';

export const listModelsInputSchema = z.object({
  capability: z.string().min(1).optional(),
  category: z.enum(['image', 'video', 'audio', 'text', '3d']).optional(),
  creator: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export const modelIdentifierInputSchema = z.object({
  air: z.string().min(1).max(256),
});

export const modelExamplesInputSchema = z.object({
  air: z.string().min(1).max(256),
  capability: z.string().min(1).optional(),
});

export const listCapabilitiesInputSchema = z.object({});

export const modelSchemaInputSchema = z.object({
  model: z.string().min(1).max(256),
});

export type ListModelsInput = z.infer<typeof listModelsInputSchema>;
export type ModelIdentifierInput = z.infer<typeof modelIdentifierInputSchema>;
export type ModelExamplesInput = z.infer<typeof modelExamplesInputSchema>;
export type ModelSchemaInput = z.infer<typeof modelSchemaInputSchema>;
