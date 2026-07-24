import { z } from 'zod';

import { inferenceParametersSchema } from '../run-inference/schema.js';

export const trainingInputSchema = z.object({
  model: z.string().min(1),
  dataset: z.string().min(1),
  checkpoint: z.string().min(1).optional(),
  importModel: z.object({
    air: z.string().min(1),
    name: z.string().min(2).max(255),
    version: z.string().min(1).optional(),
    private: z.boolean().optional().default(true),
    heroImageURL: z.url().optional(),
    shortDescription: z.string().optional(),
  }),
  parameters: inferenceParametersSchema.optional().default({}),
  includeCost: z.boolean().optional().default(true),
});

export type TrainingInput = z.infer<typeof trainingInputSchema>;
