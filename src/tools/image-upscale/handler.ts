/**
 * Handler for the image upscale tool.
 *
 * Implements image upscaling using the Runware API.
 * Supports 2x and 4x upscale factors.
 */

import { recordAnalytics, saveGeneration } from '../../database/operations.js';
import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { imageUpscaleInputSchema, ImageUpscaleOutput } from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

/**
 * Input type for image upscale.
 */
type ImageUpscaleInput = z.infer<typeof imageUpscaleInputSchema>;

/**
 * Raw API response for image upscale.
 */
interface ImageUpscaleApiResponse {
  readonly taskType: 'upscale';
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

/**
 * Builds the API request from validated input.
 */
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

// ============================================================================
// Response Processing
// ============================================================================

/**
 * Processes API response into the output format.
 */
function processResponse(response: ImageUpscaleApiResponse): ImageUpscaleOutput {
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
 * Upscales an image using the Runware API.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client (uses default if not provided)
 * @param context - Optional tool context for progress and cancellation
 * @returns Tool result with upscaled image
 */
export async function imageUpscale(
  input: ImageUpscaleInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    // Rate limit check
    await defaultRateLimiter.waitForToken(context?.signal);

    // Build request
    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('upscale', requestParams);

    // Make API call
    const response = await runwareClient.requestSingle<ImageUpscaleApiResponse>(
      task,
      { signal: context?.signal },
    );

    // Process response
    const output = processResponse(response);

    // Save to database if enabled
    saveGeneration({
      taskType: 'upscale',
      taskUUID: task.taskUUID,
      prompt: `Upscale ${String(input.upscaleFactor)}x`,
      model: input.model ?? null,
      provider: 'runware',
      status: 'completed',
      outputUrl: output.imageURL ?? null,
      outputUuid: output.imageUUID,
      width: null,
      height: null,
      cost: output.cost ?? null,
      metadata: JSON.stringify({
        upscaleFactor: input.upscaleFactor,
      }),
    });

    // Record analytics
    if (output.cost !== undefined) {
      recordAnalytics('upscale', 'runware', output.cost);
    }

    // Return result
    const message = `Image upscaled ${String(input.upscaleFactor)}x successfully`;
    return successResult(message, output, output.cost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

/**
 * MCP tool definition for image upscale.
 */
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
