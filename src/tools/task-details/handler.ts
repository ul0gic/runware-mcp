import {
  type RunwareClient,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import type { GetTaskDetailsInput } from './schema.js';

interface TaskDetailsResponse {
  readonly taskType: 'getTaskDetails';
  readonly taskUUID: string;
  readonly request: readonly Record<string, unknown>[];
  readonly response: Record<string, unknown>;
}

export async function getTaskDetails(
  input: GetTaskDetailsInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);
    const result = await runwareClient.requestSingle<TaskDetailsResponse>(
      { taskType: 'getTaskDetails', taskUUID: input.taskUUID },
      { signal: context?.signal },
    );
    return successResult(`Retrieved task ${input.taskUUID}`, result);
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export const getTaskDetailsToolDefinition = {
  name: 'getTaskDetails',
  description: 'Retrieve the original request and complete response for a Runware task UUID.',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: {
      taskUUID: { type: 'string', format: 'uuid' },
    },
    required: ['taskUUID'],
  },
} as const;
