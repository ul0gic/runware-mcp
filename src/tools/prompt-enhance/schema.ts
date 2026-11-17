// Does:  Validates promptEnhance input and describes its output.
// Holds: Prompts over 300 characters are refused, and promptMaxLength is bounded to 5-400 tokens.

import { z } from 'zod';

export const promptEnhanceInputSchema = z.object({
  prompt: z.string().min(1).max(300),

  promptVersions: z.number().int().min(1).max(5).optional().default(1),

  promptMaxLength: z.number().int().min(5).max(400).optional().default(200),

  includeCost: z.boolean().optional().default(true),
});

export type PromptEnhanceInput = z.infer<typeof promptEnhanceInputSchema>;

const promptEnhanceOutputSchema = z.object({
  enhancedPrompts: z.array(z.string()),

  cost: z.number().optional(),
});

export type PromptEnhanceOutput = z.infer<typeof promptEnhanceOutputSchema>;
