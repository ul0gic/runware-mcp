/**
 * Schema definitions for the prompt enhance tool.
 *
 * Prompt enhancement refines and diversifies image generation prompts
 * by incorporating additional descriptive keywords.
 */

import { z } from 'zod';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for prompt enhance input.
 */
export const promptEnhanceInputSchema = z.object({
  /**
   * Input prompt to enhance.
   * The original text that will be enriched with additional keywords.
   */
  prompt: z.string().min(1).max(300),

  /**
   * Number of enhanced prompt variations to generate (1-5).
   */
  promptVersions: z.number().int().min(1).max(5).optional().default(1),

  /**
   * Maximum length of enhanced prompts in tokens.
   * Approximately 100 tokens equals 75 words.
   */
  promptMaxLength: z.number().int().min(5).max(400).optional().default(200),

  /**
   * Include cost information in response.
   */
  includeCost: z.boolean().optional().default(true),
});

/**
 * Type for validated prompt enhance input.
 */
export type PromptEnhanceInput = z.infer<typeof promptEnhanceInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for prompt enhance output.
 */
export const promptEnhanceOutputSchema = z.object({
  /**
   * Array of enhanced prompt variations.
   */
  enhancedPrompts: z.array(z.string()),

  /**
   * Cost of the operation (USD).
   */
  cost: z.number().optional(),
});

/**
 * Type for prompt enhance output.
 */
export type PromptEnhanceOutput = z.infer<typeof promptEnhanceOutputSchema>;
