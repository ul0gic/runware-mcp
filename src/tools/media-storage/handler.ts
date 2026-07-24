import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import type { MediaStorageInput } from './schema.js';

export async function mediaStorage(
  input: MediaStorageInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);
    const task = createTaskRequest('mediaStorage', input);
    const response = await runwareClient.requestSingle<Record<string, unknown>>(
      task,
      { signal: context?.signal },
    );
    return successResult(
      input.operation === 'delete' ? 'Stored media deleted' : 'Media stored',
      response,
    );
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export const mediaStorageToolDefinition = {
  name: 'mediaStorage',
  description:
    'Upload media to Runware managed storage or permanently delete a stored media UUID.',
  annotations: { readOnlyHint: false, destructiveHint: true },
  inputSchema: {
    type: 'object',
    properties: {
      operation: { type: 'string', enum: ['upload', 'delete'] },
      media: {
        type: 'string',
        description: 'URL/data URI/base64 for upload; media UUID for deletion',
      },
    },
    required: ['operation', 'media'],
  },
} as const;
