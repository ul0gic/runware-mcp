/**
 * Handler for the photo maker tool.
 *
 * Implements identity-preserving image generation using the PhotoMaker API.
 * Automatically prepends the "img" trigger word if not present in the prompt.
 */

import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { photoMakerInputSchema, PhotoMakerOutput } from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

/**
 * Input type for photo maker.
 */
type PhotoMakerInput = z.infer<typeof photoMakerInputSchema>;

/**
 * Raw API response for photo maker.
 */
interface PhotoMakerApiResponse {
  readonly taskType: 'photoMaker';
  readonly taskUUID: string;
  readonly imageUUID?: string;
  readonly imageURL?: string;
  readonly imageBase64Data?: string;
  readonly imageDataURI?: string;
  readonly seed?: number;
  readonly cost?: number;
}

// ============================================================================
// Trigger Word Handling
// ============================================================================

/**
 * PhotoMaker trigger word that must be present in the prompt.
 */
const TRIGGER_WORD = 'img';

/**
 * Ensures the trigger word is present in the prompt.
 * Prepends "img " if not already present.
 */
function ensureTriggerWord(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  // Check if trigger word is already present
  // Match "img" as a standalone word
  if (lowerPrompt.includes(TRIGGER_WORD)) {
    return prompt;
  }

  // Prepend trigger word
  return `${TRIGGER_WORD} ${prompt}`;
}

// ============================================================================
// Request Building
// ============================================================================

/**
 * Builds the API request from validated input.
 */
function buildApiRequest(input: PhotoMakerInput): Record<string, unknown> {
  // model, width, height, numberResults, and includeCost have defaults from schema
  const request: Record<string, unknown> = {
    positivePrompt: ensureTriggerWord(input.positivePrompt),
    model: input.model,
    inputImages: input.inputImages,
    width: input.width,
    height: input.height,
    numberResults: input.numberResults,
    includeCost: input.includeCost,
  };

  // Generation control
  if (input.steps !== undefined) {
    request.steps = input.steps;
  }
  if (input.CFGScale !== undefined) {
    request.CFGScale = input.CFGScale;
  }
  if (input.seed !== undefined) {
    request.seed = input.seed;
  }
  if (input.scheduler !== undefined) {
    request.scheduler = input.scheduler;
  }
  if (input.negativePrompt !== undefined) {
    request.negativePrompt = input.negativePrompt;
  }

  // Identity control (both have defaults from schema)
  request.styleStrength = input.styleStrength;
  if (input.strength !== undefined) {
    request.strength = input.strength;
  }

  // Output configuration
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
 * Processes API responses into the output format.
 */
function processResponse(
  responses: readonly PhotoMakerApiResponse[],
): PhotoMakerOutput {
  let totalCost = 0;

  const images = responses.map((response) => {
    if (response.cost !== undefined) {
      totalCost += response.cost;
    }

    return {
      imageUUID: response.imageUUID ?? response.taskUUID,
      ...(response.imageURL !== undefined && { imageURL: response.imageURL }),
      ...(response.imageBase64Data !== undefined && { imageBase64Data: response.imageBase64Data }),
      ...(response.imageDataURI !== undefined && { imageDataURI: response.imageDataURI }),
      ...(response.seed !== undefined && { seed: response.seed }),
    };
  });

  return {
    images,
    ...(totalCost > 0 && { cost: totalCost }),
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Generates identity-preserving images using the PhotoMaker API.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client (uses default if not provided)
 * @param context - Optional tool context for progress and cancellation
 * @returns Tool result with generated images
 */
export async function photoMaker(
  input: PhotoMakerInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    // Rate limit check
    await defaultRateLimiter.waitForToken(context?.signal);

    // Build request
    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('photoMaker', requestParams);

    // Make API call
    const response = await runwareClient.request<PhotoMakerApiResponse>(
      [task],
      { signal: context?.signal },
    );

    // Process response
    const output = processResponse(response.data);
    const imageCount = output.images.length;

    // Return result
    const message = imageCount === 1
      ? 'Generated 1 identity-preserving image'
      : `Generated ${String(imageCount)} identity-preserving images`;

    return successResult(message, output, output.cost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

/**
 * MCP tool definition for photo maker.
 */
export const photoMakerToolDefinition = {
  name: 'photoMaker',
  description: 'Generate identity-preserving images from 1-4 reference photos. Maintains facial identity while allowing creative transformations.',
  inputSchema: {
    type: 'object',
    properties: {
      positivePrompt: {
        type: 'string',
        description: 'Text description of the desired image. The "img" trigger word is auto-prepended if not present.',
      },
      inputImages: {
        type: 'array',
        items: { type: 'string' },
        description: 'Identity reference images (1-4 images). Accepts UUIDs, URLs, or base64 data.',
        minItems: 1,
        maxItems: 4,
      },
      model: {
        type: 'string',
        description: 'PhotoMaker model identifier',
        default: 'civitai:139562@344487',
      },
      width: {
        type: 'number',
        description: 'Image width in pixels (512-2048)',
        default: 1024,
      },
      height: {
        type: 'number',
        description: 'Image height in pixels (512-2048)',
        default: 1024,
      },
      styleStrength: {
        type: 'number',
        description: 'Style strength (0-1). Lower values preserve identity more strictly.',
        default: 0.5,
      },
      numberResults: {
        type: 'number',
        description: 'Number of images to generate (1-20)',
        default: 1,
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information in response',
        default: true,
      },
    },
    required: ['positivePrompt', 'inputImages'],
  },
} as const;
