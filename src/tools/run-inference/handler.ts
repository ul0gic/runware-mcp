import { Ajv, type ErrorObject } from 'ajv';

import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { pollForResult } from '../../integrations/runware/polling.js';
import {
  type JsonSchema,
  resolveModelSchema,
} from '../../integrations/runware/schema-registry.js';
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

import { INFERENCE_TASK_TYPES, type RunInferenceInput } from './schema.js';

const ASYNC_DEFAULT_TASK_TYPES = new Set(['videoInference', 'audioInference', '3dInference']);
const ALLOWED_TASK_TYPES = new Set<string>(INFERENCE_TASK_TYPES);
const ajv = new Ajv({ allErrors: true, strict: false });

function formatValidationErrors(errors: readonly ErrorObject[] | null | undefined): string {
  return errors?.map((error) => {
    const location = error.instancePath.length === 0 ? 'request' : error.instancePath;
    return `${location} ${error.message ?? 'is invalid'}`;
  }).join('; ') ?? 'request does not match the model schema';
}

function validateAgainstModelSchema(
  schema: JsonSchema,
  parameters: Record<string, unknown>,
): void {
  const validate = ajv.compile(schema);
  if (!validate(parameters)) {
    throw new Error(`Model parameter validation failed: ${formatValidationErrors(validate.errors)}`);
  }
}

export async function runInference(
  input: RunInferenceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const resolution = await resolveModelSchema(input.model, context?.signal);
    const taskType = input.taskType ?? resolution?.taskType;
    if (taskType === undefined) {
      return errorResult(
        'Could not infer taskType from the model schema; provide an allowed taskType explicitly',
      );
    }
    if (!ALLOWED_TASK_TYPES.has(taskType)) {
      return errorResult(`Task type "${taskType}" is not allowed by runInference`);
    }

    const requestParameters = { model: input.model, ...input.parameters };
    if (input.validate && resolution !== undefined) {
      validateAgainstModelSchema(resolution.schema, requestParameters);
    } else if (input.validate) {
      return errorResult(`No live schema is available for ${input.model}; set validate=false to proceed`);
    }

    const deliveryMethod = input.deliveryMethod
      ?? (ASYNC_DEFAULT_TASK_TYPES.has(taskType) ? 'async' : 'sync');
    const task = createTaskRequest(taskType, {
      ...requestParameters,
      deliveryMethod,
    });

    if (deliveryMethod === 'async') {
      await runwareClient.request([task], { signal: context?.signal });
      const polled = await pollForResult<AsyncTaskResponse>(task.taskUUID as TaskUUID, {
        client: runwareClient,
        progress: context?.progress,
        signal: context?.signal,
      });
      return successResult(
        `${taskType} completed`,
        {
          taskUUID: task.taskUUID,
          result: polled.result,
          pollingAttempts: polled.attempts,
          elapsedMs: polled.elapsedMs,
        },
        polled.result.cost,
      );
    }

    const response = await runwareClient.request<Record<string, unknown>>(
      [task],
      { signal: context?.signal },
    );
    const costs = response.data
      .map((result) => result.cost)
      .filter((resultCost): resultCost is number => typeof resultCost === 'number');
    const cost = costs.length === 0
      ? undefined
      : costs.reduce((total, resultCost) => total + resultCost, 0);
    return successResult(
      `${taskType} completed with ${String(response.data.length)} result(s)`,
      { taskUUID: task.taskUUID, results: response.data },
      cost,
    );
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export const runInferenceToolDefinition = {
  name: 'runInference',
  description:
    'Run a non-administrative Runware inference task using the model live JSON Schema. ' +
    'Administrative operations, webhooks, and caller-supplied task UUIDs are blocked.',
  annotations: { readOnlyHint: false, destructiveHint: false },
  inputSchema: {
    type: 'object',
    properties: {
      model: { type: 'string', description: 'Runware AIR model identifier' },
      taskType: {
        type: 'string',
        enum: INFERENCE_TASK_TYPES,
        description: 'Optional when the live model schema declares the task type',
      },
      parameters: {
        type: 'object',
        description: 'Model-specific parameters obtained from modelSchema',
        additionalProperties: true,
      },
      deliveryMethod: { type: 'string', enum: ['sync', 'async'] },
      validate: {
        type: 'boolean',
        default: true,
        description: 'Validate parameters against the live model schema',
      },
    },
    required: ['model'],
  },
} as const;
