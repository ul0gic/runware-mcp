/**
 * Schema definitions for the model search tool.
 *
 * Searches for available models on the Runware platform.
 */

import { z } from 'zod';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Model category options.
 */
export const MODEL_CATEGORIES = [
  'checkpoint',
  'LoRA',
  'Lycoris',
  'ControlNet',
  'VAE',
  'embeddings',
] as const;

/**
 * Model type options.
 */
export const MODEL_TYPES = ['base', 'inpainting', 'refiner'] as const;

/**
 * Model architecture options.
 */
export const MODEL_ARCHITECTURES = [
  'FLUX.1-dev',
  'FLUX.1-schnell',
  'FLUX.1-pro',
  'Imagen',
  'SD1.5',
  'SDXL',
  'SD3',
  'Playground',
  'Pony',
] as const;

/**
 * Schema for model search input.
 */
export const modelSearchInputSchema = z.object({
  /**
   * Search term to find in model names, versions, and tags.
   */
  search: z.string().optional(),

  /**
   * Filter by tags.
   */
  tags: z.array(z.string()).optional(),

  /**
   * Filter by category.
   */
  category: z.enum(MODEL_CATEGORIES).optional(),

  /**
   * Filter by type (checkpoint only).
   */
  type: z.enum(MODEL_TYPES).optional(),

  /**
   * Filter by architecture.
   */
  architecture: z.string().optional(),

  /**
   * ControlNet conditioning type.
   */
  conditioning: z.string().optional(),

  /**
   * Visibility filter.
   */
  visibility: z.enum(['public', 'private', 'all']).optional(),

  /**
   * Results per page (1-100).
   */
  limit: z.number().int().min(1).max(100).optional().default(20),

  /**
   * Number of results to skip.
   */
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Type for validated model search input.
 */
export type ModelSearchInput = z.infer<typeof modelSearchInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for a model search result.
 */
export const modelSearchResultSchema = z.object({
  /**
   * AIR identifier for API calls.
   */
  air: z.string(),

  /**
   * Display name.
   */
  name: z.string(),

  /**
   * Version label.
   */
  version: z.string().optional(),

  /**
   * Model category.
   */
  category: z.string().optional(),

  /**
   * Model architecture.
   */
  architecture: z.string().optional(),

  /**
   * Checkpoint type.
   */
  type: z.string().optional(),

  /**
   * Associated tags.
   */
  tags: z.array(z.string()).optional(),

  /**
   * Preview image URL.
   */
  heroImage: z.string().optional(),

  /**
   * Whether model is private.
   */
  private: z.boolean().optional(),

  /**
   * Recommended default width.
   */
  defaultWidth: z.number().optional(),

  /**
   * Recommended default height.
   */
  defaultHeight: z.number().optional(),

  /**
   * Default generation steps.
   */
  defaultSteps: z.number().optional(),

  /**
   * Default scheduler.
   */
  defaultScheduler: z.string().optional(),

  /**
   * Default CFG scale.
   */
  defaultCFG: z.number().optional(),

  /**
   * Default strength (inpainting).
   */
  defaultStrength: z.number().optional(),

  /**
   * Trigger words for the model.
   */
  positiveTriggerWords: z.array(z.string()).optional(),
});

/**
 * Schema for model search output.
 */
export const modelSearchOutputSchema = z.object({
  /**
   * Array of matching models.
   */
  models: z.array(modelSearchResultSchema),

  /**
   * Total number of matching results.
   */
  totalResults: z.number(),

  /**
   * Current offset.
   */
  offset: z.number(),

  /**
   * Results per page.
   */
  limit: z.number(),
});

/**
 * Type for model search output.
 */
export type ModelSearchOutput = z.infer<typeof modelSearchOutputSchema>;
