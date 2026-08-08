import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { imageUpscaleInputSchema, ImageUpscaleOutput } from './schema.js';
import type { z } from 'zod';

type ImageUpscaleInput = z.infer<typeof imageUpscaleInputSchema>;

interface ImageUpscaleApiResponse {
  readonly taskType: 'upscale';
  readonly taskUUID: string;
  readonly imageUUID?: string;
  readonly imageURL?: string;
  readonly imageBase64Data?: string;
  readonly imageDataURI?: string;
  readonly cost?: number;
}

function buildApiRequest(input: ImageUpscaleInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    inputImage: input.inputImage,
    upscaleFactor: input.upscaleFactor,
    includeCost: input.includeCost,
  };

  if (input.model !== undefined) {
    request.model = input.model;
  }
  if (input.outputType !== undefined) {
    request.outputType = input.outputType;
  }
  if (input.outputFormat !== undefined) {
    request.outputFormat = input.outputFormat;
  }
  if (input.outputQuality !== undefined) {
    request.outputQuality = input.outputQuality;
  }

  return request;
}

function processResponse(response: ImageUpscaleApiResponse): ImageUpscaleOutput {
  return {
    imageUUID: response.imageUUID ?? response.taskUUID,
    ...(response.imageURL !== undefined && { imageURL: response.imageURL }),
    ...(response.imageBase64Data !== undefined && { imageBase64Data: response.imageBase64Data }),
    ...(response.imageDataURI !== undefined && { imageDataURI: response.imageDataURI }),
    ...(response.cost !== undefined && { cost: response.cost }),
  };
}

export async function imageUpscale(
  input: ImageUpscaleInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('upscale', requestParams);

    const response = await runwareClient.requestSingle<ImageUpscaleApiResponse>(
      task,
      { signal: context?.signal },
    );

    const output = processResponse(response);

    const message = `Image upscaled ${String(input.upscaleFactor)}x successfully`;
    return successResult(message, output, output.cost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const imageUpscaleToolDefinition = {
  name: 'imageUpscale',
  description: 'Upscale an image to 2x or 4x resolution. Maximum input size is 1MP (1024x1024).',
  inputSchema: {
    type: 'object',
    properties: {
      inputImage: {
        type: 'string',
        description: 'Image to upscale (UUID, URL, or base64)',
      },
      upscaleFactor: {
        type: 'number',
        enum: [2, 4],
        description: 'Upscale factor (2 or 4)',
        default: 2,
      },
      model: {
        type: 'string',
        description: 'Upscale model identifier (optional)',
      },
      outputType: {
        type: 'string',
        enum: ['URL', 'base64Data', 'dataURI'],
        description: 'How to return the upscaled image',
      },
      outputFormat: {
        type: 'string',
        enum: ['JPG', 'PNG', 'WEBP'],
        description: 'Image format for output',
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information in response',
        default: true,
      },
    },
    required: ['inputImage'],
  },
} as const;
