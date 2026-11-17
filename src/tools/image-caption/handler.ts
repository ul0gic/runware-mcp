// Does:  Captions an image with a vision-language model in one synchronous caption task.
// Holds: A response without caption text is an error result, never a success with an empty caption.

import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { GenerationFailedError, wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { imageCaptionInputSchema, ImageCaptionOutput } from './schema.js';
import type { z } from 'zod';

type ImageCaptionInput = z.infer<typeof imageCaptionInputSchema>;

interface ImageCaptionApiResponse {
  readonly taskType: 'caption';
  readonly taskUUID: string;
  readonly text?: string;
  readonly structuredData?: Record<string, unknown>;
  readonly cost?: number;
}

function buildApiRequest(input: ImageCaptionInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    inputs: { image: input.inputImage },
    model: input.model,
    includeCost: input.includeCost,
  };

  if (input.prompt !== undefined) {
    request.prompt = input.prompt;
  }

  return request;
}

function processResponse(response: ImageCaptionApiResponse): ImageCaptionOutput {
  if (response.text === undefined) {
    throw new GenerationFailedError('Caption response did not include text', {
      taskType: response.taskType,
      taskUUID: response.taskUUID,
    });
  }
  return {
    text: response.text,
    ...(response.structuredData !== undefined && { structuredData: response.structuredData }),
    ...(response.cost !== undefined && { cost: response.cost }),
  };
}

export async function imageCaption(
  input: ImageCaptionInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('caption', requestParams);

    const response = await runwareClient.requestSingle<ImageCaptionApiResponse>(task, { signal: context?.signal });

    const output = processResponse(response);

    return successResult('Image captioned successfully', output, output.cost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const imageCaptionToolDefinition = {
  name: 'imageCaption',
  description: 'Generate a descriptive caption for an image using vision-language models.',
  inputSchema: {
    type: 'object',
    properties: {
      inputImage: {
        type: 'string',
        description: 'Image to analyze (UUID, URL, or base64)',
      },
      model: {
        type: 'string',
        description: 'Caption model (default: Qwen2.5-VL-7B)',
        default: 'runware:152@2',
      },
      prompt: {
        type: 'string',
        description: 'Optional prompt to guide the analysis',
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information',
        default: true,
      },
    },
    required: ['inputImage'],
  },
} as const;
