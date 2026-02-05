/**
 * Handler for the image masking tool.
 *
 * Implements element detection and mask generation using Runware API.
 */

import { recordAnalytics, saveGeneration } from '../../database/operations.js';
import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { imageMaskingInputSchema, ImageMaskingOutput } from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

type ImageMaskingInput = z.infer<typeof imageMaskingInputSchema>;

/**
 * Detection bounding box from API response.
 * Property names match API format.
 */
interface DetectionBox {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  readonly x_min: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  readonly y_min: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  readonly x_max: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  readonly y_max: number;
}

interface ImageMaskingApiResponse {
  readonly taskType: 'imageMasking';
  readonly taskUUID: string;
  readonly inputImageUUID?: string;
  readonly imageUUID?: string;
  readonly maskImageURL?: string;
  readonly maskImageBase64Data?: string;
  readonly maskImageDataURI?: string;
  readonly detections?: readonly DetectionBox[];
  readonly cost?: number;
}

/**
 * Default masking model identifier.
 */
const DEFAULT_MODEL = 'runware:35@1';

// ============================================================================
// Request Building
// ============================================================================

function buildApiRequest(input: ImageMaskingInput): Record<string, unknown> {
  // All fields with defaults are guaranteed to be defined after schema parsing
  return {
    inputImage: input.inputImage,
    model: input.model,
    confidence: input.confidence,
    maxDetections: input.maxDetections,
    maskPadding: input.maskPadding,
    maskBlur: input.maskBlur,
    includeCost: input.includeCost,
    ...(input.outputType !== undefined && { outputType: input.outputType }),
    ...(input.outputFormat !== undefined && { outputFormat: input.outputFormat }),
    ...(input.outputQuality !== undefined && { outputQuality: input.outputQuality }),
  };
}

// ============================================================================
// Response Processing
// ============================================================================

function processResponse(response: ImageMaskingApiResponse): ImageMaskingOutput {
  return {
    ...(response.inputImageUUID !== undefined && { inputImageUUID: response.inputImageUUID }),
    maskImageUUID: response.imageUUID ?? response.taskUUID,
    ...(response.maskImageURL !== undefined && { maskImageURL: response.maskImageURL }),
    ...(response.maskImageBase64Data !== undefined && { maskImageBase64Data: response.maskImageBase64Data }),
    ...(response.maskImageDataURI !== undefined && { maskImageDataURI: response.maskImageDataURI }),
    detections: response.detections === undefined ? [] : [...response.detections],
    ...(response.cost !== undefined && { cost: response.cost }),
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Detects elements and generates a mask for an image.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client
 * @param context - Optional tool context
 * @returns Tool result with mask and detections
 */
export async function imageMasking(
  input: ImageMaskingInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('imageMasking', requestParams);

    const response = await runwareClient.requestSingle<ImageMaskingApiResponse>(
      task,
      { signal: context?.signal },
    );

    const output = processResponse(response);
    const detectionCount = output.detections.length;

    // model always has a default value from schema
    saveGeneration({
      taskType: 'imageMasking',
      taskUUID: task.taskUUID,
      prompt: `Masking with ${input.model}`,
      model: input.model,
      provider: 'runware',
      status: 'completed',
      outputUrl: output.maskImageURL ?? null,
      outputUuid: output.maskImageUUID,
      width: null,
      height: null,
      cost: output.cost ?? null,
      metadata: JSON.stringify({
        detectionCount,
        confidence: input.confidence,
      }),
    });

    if (output.cost !== undefined) {
      recordAnalytics('imageMasking', 'runware', output.cost);
    }

    const message = detectionCount === 1
      ? 'Detected 1 element and generated mask'
      : `Detected ${String(detectionCount)} elements and generated mask`;

    return successResult(message, output, output.cost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const imageMaskingToolDefinition = {
  name: 'imageMasking',
  description: 'Detect faces, hands, or other elements and generate a mask for inpainting.',
  inputSchema: {
    type: 'object',
    properties: {
      inputImage: {
        type: 'string',
        description: 'Image to analyze (UUID, URL, or base64)',
      },
      model: {
        type: 'string',
        description: 'Detection model (default: face_yolov8n)',
        default: DEFAULT_MODEL,
      },
      confidence: {
        type: 'number',
        description: 'Detection confidence threshold (0-1)',
        default: 0.25,
      },
      maxDetections: {
        type: 'number',
        description: 'Maximum elements to detect (1-20)',
        default: 6,
      },
      maskPadding: {
        type: 'number',
        description: 'Extend/reduce mask area in pixels',
        default: 4,
      },
      maskBlur: {
        type: 'number',
        description: 'Fade-out effect at mask edges',
        default: 4,
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
