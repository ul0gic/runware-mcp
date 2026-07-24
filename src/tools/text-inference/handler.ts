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

import type { TextInferenceInput } from './schema.js';

interface TextInferenceResponse extends AsyncTaskResponse {
  readonly taskType: 'textInference';
  readonly text?: string;
  readonly reasoningContent?: string;
  readonly finishReason?: string;
  readonly usage?: Record<string, unknown>;
  readonly toolCalls?: readonly Record<string, unknown>[];
}

function buildRequest(input: TextInferenceInput): Record<string, unknown> {
  return {
    model: input.model,
    messages: input.messages,
    includeCost: input.includeCost,
    includeUsage: input.includeUsage,
    deliveryMethod: input.deliveryMethod,
    outputFormat: input.outputFormat,
    ...(input.inputs !== undefined && { inputs: input.inputs }),
    ...(input.settings !== undefined && { settings: input.settings }),
    ...(input.tools !== undefined && { tools: input.tools }),
    ...(input.toolChoice !== undefined && { toolChoice: input.toolChoice }),
    ...(input.numberResults !== undefined && { numberResults: input.numberResults }),
  };
}

export async function textInference(
  input: TextInferenceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);
    const task = createTaskRequest('textInference', buildRequest(input));

    if (input.deliveryMethod === 'async') {
      await runwareClient.request([task], { signal: context?.signal });
      const polled = await pollForResult<TextInferenceResponse>(task.taskUUID as TaskUUID, {
        client: runwareClient,
        progress: context?.progress,
        signal: context?.signal,
      });
      return successResult('Text inference completed', polled.result, polled.result.cost);
    }

    const response = await runwareClient.request<TextInferenceResponse>(
      [task],
      { signal: context?.signal },
    );
    const totalCost = response.data.reduce(
      (total, result) => total + (result.cost ?? 0),
      0,
    );
    return successResult(
      `Text inference completed with ${String(response.data.length)} result(s)`,
      { taskUUID: task.taskUUID, results: response.data },
      totalCost,
    );
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export const textInferenceToolDefinition = {
  name: 'textInference',
  description:
    'Run Runware text and multimodal LLM inference with optional media inputs, tool definitions, usage, and cost metadata.',
  inputSchema: {
    type: 'object',
    properties: {
      model: { type: 'string' },
      messages: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'assistant'],
            },
            content: { type: 'string', minLength: 1 },
          },
          required: ['role', 'content'],
        },
      },
      inputs: {
        type: 'object',
        description: 'Model-specific image, video, audio, or document input arrays',
        additionalProperties: true,
      },
      settings: { type: 'object', additionalProperties: true },
      outputFormat: { type: 'string', default: 'TEXT' },
      tools: { type: 'array', items: { type: 'object', additionalProperties: true } },
      toolChoice: { type: 'object', additionalProperties: true },
      numberResults: { type: 'integer', minimum: 1, maximum: 10 },
      includeCost: { type: 'boolean', default: true },
      includeUsage: { type: 'boolean', default: true },
      deliveryMethod: { type: 'string', enum: ['sync', 'async'], default: 'sync' },
    },
    required: ['model', 'messages'],
  },
} as const;
