// Does:  Validates costEstimate input and describes the estimate it returns.
// Holds: taskType is limited to the task types the handler has an estimator for.

import { z } from 'zod';

const ESTIMABLE_TASK_TYPES = [
  'imageInference',
  'photoMaker',
  'upscale',
  'removeBackground',
  'caption',
  'imageMasking',
  'videoInference',
  'audioInference',
] as const;

export const costEstimateInputSchema = z.object({
  taskType: z.enum(ESTIMABLE_TASK_TYPES),

  model: z.string().optional(),

  width: z.number().int().min(128).max(2048).optional(),

  height: z.number().int().min(128).max(2048).optional(),

  duration: z.number().min(1).max(300).optional(),

  numberResults: z.number().int().min(1).max(20).optional().default(1),

  steps: z.number().int().min(1).max(100).optional(),
});

const costEstimateOutputSchema = z.object({
  taskType: z.string(),

  costPerUnit: z.number(),

  units: z.number(),

  unitDescription: z.string(),

  totalCost: z.number(),

  pricingBasis: z.string(),

  isEstimate: z.boolean(),

  notes: z.string().optional(),
});

export type CostEstimateOutput = z.infer<typeof costEstimateOutputSchema>;
