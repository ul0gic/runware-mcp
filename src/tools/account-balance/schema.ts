import { z } from 'zod';

export const accountBalanceInputSchema = z.object({
  // Intentionally empty: object form keeps parity with every other tool input schema.
});

export type AccountBalanceInput = z.infer<typeof accountBalanceInputSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const accountBalanceOutputSchema = z.object({
  balance: z.number(),

  currency: z.string().default('USD'),

  retrievedAt: z.string().optional(),
});

export type AccountBalanceOutput = z.infer<typeof accountBalanceOutputSchema>;
