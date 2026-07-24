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

import type { TrainingInput } from './schema.js';

interface TrainingResponse extends AsyncTaskResponse {
  readonly taskType: 'training';
  readonly air?: string;
  readonly outputs?: {
    readonly files?: readonly {
      readonly uuid: string;
      readonly url: string;
    }[];
  };
}

export async function training(
  input: TrainingInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);
    const task = createTaskRequest('training', {
      model: input.model,
      inputs: {
        dataset: input.dataset,
        ...(input.checkpoint !== undefined && { checkpoint: input.checkpoint }),
      },
      importModel: input.importModel,
      ...input.parameters,
      includeCost: input.includeCost,
      deliveryMethod: 'async',
    });
    await runwareClient.request([task], { signal: context?.signal });
    const polled = await pollForResult<TrainingResponse>(task.taskUUID as TaskUUID, {
      client: runwareClient,
      progress: context?.progress,
      signal: context?.signal,
    });
    return successResult(
      polled.result.air === undefined
        ? 'Training completed'
        : `Training completed: ${polled.result.air}`,
      {
        taskUUID: task.taskUUID,
        air: polled.result.air,
        files: polled.result.outputs?.files ?? [],
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

export const trainingToolDefinition = {
  name: 'training',
  description:
    'Run a model-specific Runware training workflow using a ZIP dataset and explicit parameters from modelSchema.',
  annotations: { readOnlyHint: false, destructiveHint: false },
  inputSchema: {
    type: 'object',
    properties: {
      model: { type: 'string' },
      dataset: { type: 'string', description: 'ZIP dataset UUID or URL' },
      checkpoint: { type: 'string', description: 'Optional Runware-trained LoRA AIR to resume' },
      importModel: {
        type: 'object',
        description: 'Metadata for importing the trained model into Runware',
        properties: {
          air: { type: 'string' },
          name: { type: 'string', minLength: 2, maxLength: 255 },
          version: { type: 'string' },
          private: { type: 'boolean', default: true },
          heroImageURL: { type: 'string', format: 'uri' },
          shortDescription: { type: 'string' },
        },
        required: ['air', 'name'],
      },
      parameters: { type: 'object', additionalProperties: true },
      includeCost: { type: 'boolean', default: true },
    },
    required: ['model', 'dataset', 'importModel'],
  },
} as const;
