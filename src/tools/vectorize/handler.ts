/**
 * Handler for the vectorize tool.
 *
 * Implements raster-to-SVG conversion using the Runware API.
 * This is a synchronous operation.
 */

import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { RunwareApiError, wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import { VECTORIZE_MODELS, type VectorizeInput, type VectorizeOutput } from './schema.js';

// ============================================================================
// Types
// ============================================================================

interface VectorizeApiResponse {
  readonly taskType: 'vectorize';
  readonly taskUUID: string;
  readonly imageUUID?: string;
  readonly imageURL?: string;
  readonly imageBase64Data?: string;
  readonly imageDataURI?: string;
  readonly cost?: number;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates the vectorize model against known models.
 */
function validateModel(model: string): void {
  if (!(VECTORIZE_MODELS as readonly string[]).includes(model)) {
    throw new RunwareApiError(
      `Invalid vectorize model: ${model}. Valid models: ${VECTORIZE_MODELS.join(', ')}`,
      { apiCode: 'INVALID_MODEL' },
    );
  }
}

// ============================================================================
// Request Building
// ============================================================================

/**
 * Builds the API request from validated input.
 */
function buildApiRequest(input: VectorizeInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    model: input.model,
    inputs: {
      image: input.inputImage,
    },
    outputFormat: input.outputFormat,
    includeCost: input.includeCost,
  };

  if (input.outputType !== undefined) {
    request.outputType = input.outputType;
  }

  return request;
}

// ============================================================================
// Response Processing
// ============================================================================

/**
 * Processes API response into the output format.
 */
function processResponse(response: VectorizeApiResponse): VectorizeOutput {
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
 * Vectorizes an image using the Runware API.
 *
 * Converts raster images (PNG, JPG, WEBP) to scalable vector graphics (SVG).
 * This is a synchronous operation that returns the result immediately.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client
 * @param context - Optional tool context for progress and cancellation
 * @returns Tool result with vectorized SVG
 */
export async function vectorize(
  input: VectorizeInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    // Validate model
    validateModel(input.model);

    // Rate limit check
    await defaultRateLimiter.waitForToken(context?.signal);

    // Build request
    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('vectorize', requestParams);

    // Make API call (synchronous)
    const response = await runwareClient.requestSingle<VectorizeApiResponse>(task, {
      signal: context?.signal,
    });

    // Process response
    const output = processResponse(response);

    // Return result
    return successResult('Image vectorized to SVG successfully', output, output.cost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

/**
 * MCP tool definition for vectorize.
 */
export const vectorizeToolDefinition = {
  name: 'vectorize',
  description:
    'Convert raster images (PNG, JPG, WEBP) to scalable vector graphics (SVG). Ideal for logos, icons, and illustrations.',
  inputSchema: {
    type: 'object',
    properties: {
      inputImage: {
        type: 'string',
        description: 'Image to vectorize (UUID, URL, or base64)',
      },
      model: {
        type: 'string',
        enum: ['recraft:1@1', 'picsart:1@1'],
        description: 'Vectorization model',
        default: 'recraft:1@1',
      },
      outputType: {
        type: 'string',
        enum: ['URL', 'base64Data', 'dataURI'],
        description: 'How to return the vectorized image',
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
