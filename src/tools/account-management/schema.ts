import { z } from 'zod';

export const ACCOUNT_OPERATIONS = [
  'getDetails',
  'getUsageActivity',
  'getUsagePerformance',
  'getUsageErrors',
] as const;

const dateSchema = z.iso.date();

export const accountManagementInputSchema = z.object({
  operation: z.enum(ACCOUNT_OPERATIONS),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  models: z.array(z.string()).max(100).optional(),
  apiKeys: z.array(z.string()).max(100).optional(),
  groupBy: z.array(z.enum(['date', 'model', 'apiKey'])).min(1).max(3).optional(),
  timezone: z.string().min(1).optional(),
}).superRefine((input, context) => {
  if (input.operation === 'getDetails') {
    return;
  }
  if (input.startDate === undefined) {
    context.addIssue({ code: 'custom', path: ['startDate'], message: 'startDate is required' });
  }
  if (input.endDate === undefined) {
    context.addIssue({ code: 'custom', path: ['endDate'], message: 'endDate is required' });
  }
  if (
    input.startDate !== undefined
    && input.endDate !== undefined
    && input.startDate > input.endDate
  ) {
    context.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'endDate must be on or after startDate',
    });
  }
  if (input.startDate !== undefined && input.endDate !== undefined) {
    const start = Date.parse(`${input.startDate}T00:00:00Z`);
    const end = Date.parse(`${input.endDate}T00:00:00Z`);
    const maximumRangeMs = 30 * 24 * 60 * 60 * 1000;
    if (end - start > maximumRangeMs) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'usage date ranges cannot exceed 30 days',
      });
    }
  }
});

export type AccountManagementInput = z.infer<typeof accountManagementInputSchema>;
