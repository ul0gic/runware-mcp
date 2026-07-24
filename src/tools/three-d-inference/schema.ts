import { z } from 'zod';

import { inferenceParametersSchema } from '../run-inference/schema.js';

export const threeDInferenceInputSchema = z.object({
  model: z.string().min(1),
  positivePrompt: z.string().min(1).optional(),
  inputImage: z.string().min(1).optional(),
  parameters: inferenceParametersSchema.optional().default({}),
  includeCost: z.boolean().optional().default(true),
}).refine(
  (input) => input.positivePrompt !== undefined || input.inputImage !== undefined,
  { message: 'positivePrompt or inputImage is required' },
);

export type ThreeDInferenceInput = z.infer<typeof threeDInferenceInputSchema>;
