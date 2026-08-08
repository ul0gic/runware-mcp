import { z } from 'zod';

export const promptEnhanceInputSchema = z.object({
  prompt: z.string().min(1).max(300),

  promptVersions: z.number().int().min(1).max(5).optional().default(1),

  /** Tokens, not words — roughly 100 tokens per 75 words. */
  promptMaxLength: z.number().int().min(5).max(400).optional().default(200),

  includeCost: z.boolean().optional().default(true),
});

export type PromptEnhanceInput = z.infer<typeof promptEnhanceInputSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const promptEnhanceOutputSchema = z.object({
  enhancedPrompts: z.array(z.string()),

  cost: z.number().optional(),
});

export type PromptEnhanceOutput = z.infer<typeof promptEnhanceOutputSchema>;
