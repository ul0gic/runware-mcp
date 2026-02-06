/**
 * Handler for the image background removal tool.
 *
 * Implements background removal using the Runware API.
 */

import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { imageBackgroundRemovalInputSchema, ImageBackgroundRemovalOutput } from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

type ImageBackgroundRemovalInput = z.infer<typeof imageBackgroundRemovalInputSchema>;

interface ImageBackgroundRemovalApiResponse {
  readonly taskType: 'removeBackground';
  readonly taskUUID: string;
  readonly imageUUID?: string;
  readonly imageURL?: string;
  readonly imageBase64Data?: string;
  readonly imageDataURI?: string;
  readonly cost?: number;
}

// ============================================================================
// Request Building
// ============================================================================

function buildApiRequest(input: ImageBackgroundRemovalInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    inputImage: input.inputImage,
    model: input.model,
  };

  // Flatten settings into request if present
  if (input.settings !== undefined) {
    Object.assign(request, input.settings);
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

  // includeCost always has a default value from schema
  request.includeCost = input.includeCost;

  return request;
}

// ============================================================================
// Response Processing
// ============================================================================

function processResponse(response: ImageBackgroundRemovalApiResponse): ImageBackgroundRemovalOutput {
  return {
    imageUUID: response.imageUUID ?? response.taskUUID,
    ...(response.imageURL !== undefined && { imageURL: response.imageURL }),
    ...(response.imageBase64Data !== undefined && { imageBase64Data: response.imageBase64Data }),
    ...(response.imageDataURI !== undefined && { imageDataURI: response.imageDataURI }),
    ...(response.cost !== undefined && { cost: response.cost }),
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Removes the background from an image.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client
 * @param context - Optional tool context
 * @returns Tool result with processed image
 */
export async function imageBackgroundRemoval(
  input: ImageBackgroundRemovalInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('removeBackground', requestParams);

    const response = await runwareClient.requestSingle<ImageBackgroundRemovalApiResponse>(
      task,
      { signal: context?.signal },
    );

    const output = processResponse(response);

    return successResult('Background removed successfully', output, output.cost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const imageBackgroundRemovalToolDefinition = {
  name: 'imageBackgroundRemoval',
  description: 'Remove the background from an image, creating a transparent PNG.',
  inputSchema: {
    type: 'object',
    properties: {
      inputImage: {
        type: 'string',
        description: 'Image to process (UUID, URL, or base64)',
      },
      model: {
        type: 'string',
        description: 'Background removal model',
        default: 'runware:109@1',
      },
      outputType: {
        type: 'string',
        enum: ['URL', 'base64Data', 'dataURI'],
        description: 'How to return the processed image',
      },
      outputFormat: {
        type: 'string',
        enum: ['JPG', 'PNG', 'WEBP'],
        description: 'Image format (use PNG for transparency)',
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
