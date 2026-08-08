import { z } from 'zod';

export const accountBalanceInputSchema = z.object({
  // Intentionally empty: object form keeps parity with every other tool input schema.
});

export type AccountBalanceInput = z.infer<typeof accountBalanceInputSchema>;

export const accountBalanceOutputSchema = z.object({
  balance: z.number(),

  currency: z.string().default('USD'),

  retrievedAt: z.string().optional(),
});

export type AccountBalanceOutput = z.infer<typeof accountBalanceOutputSchema>;
