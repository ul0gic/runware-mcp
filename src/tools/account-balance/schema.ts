// Does:  Declares the empty input and the balance output shape for accountBalance.
// Holds: The input is an object schema with no keys, so any extra arguments are stripped before the handler runs.

import { z } from 'zod';

export const accountBalanceInputSchema = z.object({
  // Why: An object schema, not z.void(), so bindTool can parse it like every other tool input.
});

export type AccountBalanceInput = z.infer<typeof accountBalanceInputSchema>;

const accountBalanceOutputSchema = z.object({
  balance: z.number(),

  currency: z.string().default('USD'),

  retrievedAt: z.string().optional(),
});

export type AccountBalanceOutput = z.infer<typeof accountBalanceOutputSchema>;
