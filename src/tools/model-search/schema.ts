import { z } from 'zod';

const MODEL_CATEGORIES = [
  'checkpoint',
  'lora',
  'lycoris',
  'vae',
  'embeddings',
  // Legacy aliases retained for existing clients.
  'LoRA',
  'Lycoris',
  'ControlNet',
  'VAE',
] as const;

const MODEL_TYPES = ['base', 'inpainting', 'refiner'] as const;

export const modelSearchInputSchema = z.object({
  search: z.string().optional(),

  source: z.enum(['featured', 'community']).optional(),

  tags: z.array(z.string()).optional(),

  category: z.enum(MODEL_CATEGORIES).optional(),

  type: z.enum(MODEL_TYPES).optional(),

  architecture: z.string().optional(),

  conditioning: z.string().optional(),

  capabilities: z.array(z.string()).optional(),

  visibility: z.enum(['public', 'private', 'favorite', 'owned', 'all']).optional(),

  sort: z.enum([
    'popularity',
    '-popularity',
    'name',
    '-name',
    'addedUnixTimestamp',
    '-addedUnixTimestamp',
    'updatedDateUnixTimestamp',
    '-updatedDateUnixTimestamp',
  ]).optional(),

  limit: z.number().int().min(1).max(100).optional().default(20),

  offset: z.number().int().min(0).optional().default(0),
});

const modelSearchResultSchema = z.object({
  air: z.string(),

  name: z.string(),

  version: z.string().optional(),

  category: z.string().optional(),

  architecture: z.string().optional(),

  type: z.string().optional(),

  tags: z.array(z.string()).optional(),

  heroImage: z.string().optional(),

  private: z.boolean().optional(),

  defaultWidth: z.number().optional(),

  defaultHeight: z.number().optional(),

  defaultSteps: z.number().optional(),

  defaultScheduler: z.string().optional(),

  defaultCFG: z.number().optional(),

  defaultStrength: z.number().optional(),

  positiveTriggerWords: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  source: z.enum(['featured', 'community']).optional(),
  isFavorite: z.boolean().optional(),
  provider: z.string().optional(),
  shortDescription: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const modelSearchOutputSchema = z.object({
  models: z.array(modelSearchResultSchema),

  totalResults: z.number(),

  offset: z.number(),

  limit: z.number(),
});

export type ModelSearchOutput = z.infer<typeof modelSearchOutputSchema>;
