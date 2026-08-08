import { z } from 'zod';

export const ESTIMABLE_TASK_TYPES = [
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

  /** Affects pricing for some task types. */
  model: z.string().optional(),

  /** Applies to image tasks. */
  width: z.number().int().min(128).max(2048).optional(),

  /** Applies to image tasks. */
  height: z.number().int().min(128).max(2048).optional(),

  /** Seconds; applies to video and audio tasks. */
  duration: z.number().min(1).max(300).optional(),

  numberResults: z.number().int().min(1).max(20).optional().default(1),

  /** Affects pricing for some image tasks. */
  steps: z.number().int().min(1).max(100).optional(),
});

export type CostEstimateInput = z.infer<typeof costEstimateInputSchema>;

export const costEstimateOutputSchema = z.object({
  taskType: z.string(),

  /** USD per unit. */
  costPerUnit: z.number(),

  units: z.number(),

  /** Unit the estimate is priced in, e.g. "image" or "second". */
  unitDescription: z.string(),

  /** Total estimate in USD. */
  totalCost: z.number(),

  /** Pricing tier or model the estimate was derived from. */
  pricingBasis: z.string(),

  isEstimate: z.boolean(),

  notes: z.string().optional(),
});

export type CostEstimateOutput = z.infer<typeof costEstimateOutputSchema>;
