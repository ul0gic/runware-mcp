/**
 * Schema definitions for the cost estimate tool.
 *
 * Estimates the cost of operations before execution.
 * This is a local tool based on known pricing.
 */

import { z } from 'zod';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Supported task types for cost estimation.
 */
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

/**
 * Schema for cost estimate input.
 */
export const costEstimateInputSchema = z.object({
  /**
   * Type of task to estimate.
   */
  taskType: z.enum(ESTIMABLE_TASK_TYPES),

  /**
   * Model identifier (affects pricing for some tasks).
   */
  model: z.string().optional(),

  /**
   * Image width (for image tasks).
   */
  width: z.number().int().min(128).max(2048).optional(),

  /**
   * Image height (for image tasks).
   */
  height: z.number().int().min(128).max(2048).optional(),

  /**
   * Duration in seconds (for video/audio tasks).
   */
  duration: z.number().min(1).max(300).optional(),

  /**
   * Number of results to generate.
   */
  numberResults: z.number().int().min(1).max(20).optional().default(1),

  /**
   * Number of steps (affects some image tasks).
   */
  steps: z.number().int().min(1).max(100).optional(),
});

/**
 * Type for validated cost estimate input.
 */
export type CostEstimateInput = z.infer<typeof costEstimateInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for cost estimate output.
 */
export const costEstimateOutputSchema = z.object({
  /**
   * Task type being estimated.
   */
  taskType: z.string(),

  /**
   * Estimated cost per unit (USD).
   */
  costPerUnit: z.number(),

  /**
   * Number of units.
   */
  units: z.number(),

  /**
   * Unit description (e.g., "image", "second").
   */
  unitDescription: z.string(),

  /**
   * Total estimated cost (USD).
   */
  totalCost: z.number(),

  /**
   * Pricing tier or model used for estimation.
   */
  pricingBasis: z.string(),

  /**
   * Whether this is a rough estimate.
   */
  isEstimate: z.boolean(),

  /**
   * Any notes about the estimate.
   */
  notes: z.string().optional(),
});

/**
 * Type for cost estimate output.
 */
export type CostEstimateOutput = z.infer<typeof costEstimateOutputSchema>;
