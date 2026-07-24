import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { pollForResult } from '../../integrations/runware/polling.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import {
  type AsyncTaskResponse,
  type TaskUUID,
  type ToolContext,
  type ToolResult,
  errorResult,
  successResult,
} from '../../shared/types.js';

import type { ModelUploadInput } from './schema.js';

interface ModelUploadResponse extends AsyncTaskResponse {
  readonly taskType: 'modelUpload';
  readonly air?: string;
  readonly message?: string;
}

export async function modelUpload(
  input: ModelUploadInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);
    const {
      defaults,
      ...metadata
    } = input;
    const task = createTaskRequest('modelUpload', {
      ...defaults,
      ...metadata,
      deliveryMethod: 'async',
    });
    await runwareClient.request([task], { signal: context?.signal });
    const polled = await pollForResult<ModelUploadResponse>(task.taskUUID as TaskUUID, {
      client: runwareClient,
      progress: context?.progress,
      signal: context?.signal,
    });
    return successResult(
      polled.result.air === undefined
        ? 'Model upload completed'
        : `Model upload completed: ${polled.result.air}`,
      {
        ...polled.result,
        pollingAttempts: polled.attempts,
        elapsedMs: polled.elapsedMs,
      },
    );
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export const modelUploadToolDefinition = {
  name: 'modelUpload',
  description:
    'Upload and deploy a custom safetensors model. The remote weight URL must use HTTPS.',
  annotations: { readOnlyHint: false, destructiveHint: false },
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['checkpoint', 'lora', 'lycoris', 'vae', 'embeddings'],
      },
      architecture: { type: 'string' },
      format: { type: 'string', enum: ['safetensors'], default: 'safetensors' },
      name: { type: 'string', maxLength: 200 },
      version: { type: 'string', maxLength: 100 },
      downloadURL: { type: 'string', format: 'uri', pattern: '^https://' },
      private: { type: 'boolean', default: true },
      air: { type: 'string' },
      uniqueIdentifier: { type: 'string' },
      heroImageURL: { type: 'string', format: 'uri', pattern: '^https://' },
      tags: { type: 'array', maxItems: 50, items: { type: 'string' } },
      shortDescription: { type: 'string', maxLength: 500 },
      comment: { type: 'string', maxLength: 2000 },
      type: {
        type: 'string',
        enum: ['base', 'inpainting', 'positive', 'negative'],
      },
      defaults: { type: 'object', additionalProperties: true },
    },
    required: ['category', 'architecture', 'name', 'version', 'downloadURL'],
  },
} as const;
