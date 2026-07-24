import { z } from 'zod';

import { uuidSchema } from '../../shared/validation.js';

export const getTaskDetailsInputSchema = z.object({
  taskUUID: uuidSchema,
});

export type GetTaskDetailsInput = z.infer<typeof getTaskDetailsInputSchema>;
