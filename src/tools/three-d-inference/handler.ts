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

import type { ThreeDInferenceInput } from './schema.js';

interface ThreeDInferenceResponse extends AsyncTaskResponse {
  readonly taskType: '3dInference';
  readonly outputs?: {
    readonly files?: readonly {
      readonly uuid: string;
      readonly url: string;
    }[];
  };
}

export async function threeDInference(
  input: ThreeDInferenceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);
    const task = createTaskRequest('3dInference', {
      model: input.model,
      ...input.parameters,
      ...(input.positivePrompt !== undefined && { positivePrompt: input.positivePrompt }),
      ...(input.inputImage !== undefined && { inputs: { images: [input.inputImage] } }),
      includeCost: input.includeCost,
      deliveryMethod: 'async',
    });

    await runwareClient.request([task], { signal: context?.signal });
    const polled = await pollForResult<ThreeDInferenceResponse>(task.taskUUID as TaskUUID, {
      client: runwareClient,
      progress: context?.progress,
      signal: context?.signal,
    });
    const files = polled.result.outputs?.files ?? [];

    return successResult(
      `3D inference completed with ${String(files.length)} file(s)`,
      {
        taskUUID: task.taskUUID,
        files,
        pollingAttempts: polled.attempts,
        elapsedMs: polled.elapsedMs,
      },
      polled.result.cost,
    );
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export const threeDInferenceToolDefinition = {
  name: 'threeDInference',
  description: 'Generate 3D assets from a text prompt or input image using a Runware 3D model.',
  inputSchema: {
    type: 'object',
    properties: {
      model: { type: 'string' },
      positivePrompt: { type: 'string' },
      inputImage: { type: 'string', description: 'Image UUID or URL' },
      parameters: { type: 'object', additionalProperties: true },
      includeCost: { type: 'boolean', default: true },
    },
    required: ['model'],
    anyOf: [
      { required: ['positivePrompt'] },
      { required: ['inputImage'] },
    ],
  },
} as const;
