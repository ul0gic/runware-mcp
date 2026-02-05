/**
 * Schema definitions for the account balance tool.
 *
 * Retrieves the current Runware account credit balance.
 */

import { z } from 'zod';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Schema for account balance input.
 * No parameters required - just fetches current balance.
 */
export const accountBalanceInputSchema = z.object({
  /**
   * No parameters needed for balance check.
   * This is intentionally empty but we use an object
   * for consistency with other tools.
   */
});

/**
 * Type for validated account balance input.
 */
export type AccountBalanceInput = z.infer<typeof accountBalanceInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Schema for account balance output.
 */
export const accountBalanceOutputSchema = z.object({
  /**
   * Current account balance.
   */
  balance: z.number(),

  /**
   * Currency code (typically USD).
   */
  currency: z.string().default('USD'),

  /**
   * Timestamp of when balance was retrieved.
   */
  retrievedAt: z.string().optional(),
});

/**
 * Type for account balance output.
 */
export type AccountBalanceOutput = z.infer<typeof accountBalanceOutputSchema>;
