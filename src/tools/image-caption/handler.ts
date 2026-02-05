/**
 * Handler for the image caption tool.
 *
 * Implements image captioning using vision-language models.
 */

import { recordAnalytics, saveGeneration } from '../../database/operations.js';
import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { imageCaptionInputSchema, ImageCaptionOutput } from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

type ImageCaptionInput = z.infer<typeof imageCaptionInputSchema>;

interface ImageCaptionApiResponse {
  readonly taskType: 'caption';
  readonly taskUUID: string;
  readonly text?: string;
  readonly structuredData?: Record<string, unknown>;
  readonly cost?: number;
}

// ============================================================================
// Request Building
// ============================================================================

function buildApiRequest(input: ImageCaptionInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    inputImage: input.inputImage,
    model: input.model,
    includeCost: input.includeCost,
  };

  if (input.prompt !== undefined) {
    request.prompt = input.prompt;
  }

  return request;
}

// ============================================================================
// Response Processing
// ============================================================================

function processResponse(response: ImageCaptionApiResponse): ImageCaptionOutput {
  return {
    text: response.text ?? '',
    ...(response.structuredData !== undefined && { structuredData: response.structuredData }),
    ...(response.cost !== undefined && { cost: response.cost }),
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Generates a caption/description for an image.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client
 * @param context - Optional tool context
 * @returns Tool result with caption
 */
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

    const response = await runwareClient.requestSingle<ImageCaptionApiResponse>(
      task,
      { signal: context?.signal },
    );

    const output = processResponse(response);

    // model always has a default value from schema
    saveGeneration({
      taskType: 'caption',
      taskUUID: task.taskUUID,
      prompt: input.prompt ?? 'Auto-caption',
      model: input.model,
      provider: 'runware',
      status: 'completed',
      outputUrl: null,
      outputUuid: null,
      width: null,
      height: null,
      cost: output.cost ?? null,
      metadata: JSON.stringify({
        captionText: output.text.slice(0, 500),
      }),
    });

    if (output.cost !== undefined) {
      recordAnalytics('caption', 'runware', output.cost);
    }

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
