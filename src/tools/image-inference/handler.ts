/**
 * Handler for the image inference tool.
 *
 * Implements text-to-image, image-to-image, inpainting, and outpainting
 * operations using the Runware API.
 */

import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { detectProvider } from '../../shared/provider-settings.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { imageInferenceInputSchema, ImageInferenceOutput } from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

/**
 * Input type for image inference.
 */
type ImageInferenceInput = z.infer<typeof imageInferenceInputSchema>;

/**
 * Raw API response for image inference.
 * Note: NSFWContent uses API naming convention.
 */
interface ImageInferenceApiResponse {
  readonly taskType: 'imageInference';
  readonly taskUUID: string;
  readonly imageUUID?: string;
  readonly imageURL?: string;
  readonly imageBase64Data?: string;
  readonly imageDataURI?: string;
  readonly seed?: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response field
  readonly NSFWContent?: boolean;
  readonly cost?: number;
}

// ============================================================================
// Request Building Helpers
// ============================================================================

/**
 * Adds optional parameters to request if defined.
 * Keys are compile-time constants, not user input.
 */
function addOptionalParams(
  request: Record<string, unknown>,
  input: ImageInferenceInput,
  keys: readonly (keyof ImageInferenceInput)[],
): void {
  for (const key of keys) {
    // eslint-disable-next-line security/detect-object-injection -- keys are compile-time constants
    const value = input[key];
    if (value !== undefined) {
      // eslint-disable-next-line security/detect-object-injection -- keys are compile-time constants
      request[key] = value;
    }
  }
}

/**
 * Adds generation control parameters.
 */
function addGenerationParams(request: Record<string, unknown>, input: ImageInferenceInput): void {
  addOptionalParams(request, input, [
    'steps',
    'seed',
    'scheduler',
    'negativePrompt',
  ]);
  // CFGScale uses API naming convention
  if (input.CFGScale !== undefined) {
    request.CFGScale = input.CFGScale;
  }
  // numberResults always has a default value from schema
  request.numberResults = input.numberResults;
}

/**
 * Adds image input parameters.
 */
function addImageInputParams(request: Record<string, unknown>, input: ImageInferenceInput): void {
  addOptionalParams(request, input, [
    'seedImage',
    'maskImage',
    'referenceImages',
    'strength',
    'maskMargin',
    'outpaint',
  ]);
}

/**
 * Adds advanced feature parameters.
 */
function addAdvancedParams(request: Record<string, unknown>, input: ImageInferenceInput): void {
  addOptionalParams(request, input, [
    'controlNet',
    'lora',
    'embeddings',
    'ipAdapters',
    'refiner',
    'vae',
    'pulid',
    'acePlusPlus',
    'acceleration',
    'teaCache',
    'deepCache',
    'ultralytics',
  ]);
}

/**
 * Adds output configuration parameters.
 */
function addOutputParams(request: Record<string, unknown>, input: ImageInferenceInput): void {
  addOptionalParams(request, input, [
    'outputType',
    'outputFormat',
    'outputQuality',
    'safety',
    'ttl',
  ]);
  // includeCost always has a default value from schema
  request.includeCost = input.includeCost;
}

/**
 * Adds provider-specific settings.
 */
function addProviderSettings(
  request: Record<string, unknown>,
  input: ImageInferenceInput,
): void {
  if (input.providerSettings === undefined) {
    return;
  }

  const provider = detectProvider(input.model);
  if (provider === undefined) {
    return;
  }

  // eslint-disable-next-line security/detect-object-injection -- provider is a validated enum from detectProvider
  const providerConfig = input.providerSettings[provider];
  if (providerConfig !== undefined) {
    Object.assign(request, providerConfig);
  }
}

// ============================================================================
// Request Building
// ============================================================================

/**
 * Builds the API request from validated input.
 */
function buildApiRequest(input: ImageInferenceInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    positivePrompt: input.positivePrompt,
    model: input.model,
    width: input.width,
    height: input.height,
  };

  addGenerationParams(request, input);
  addImageInputParams(request, input);
  addAdvancedParams(request, input);
  addProviderSettings(request, input);
  addOutputParams(request, input);

  return request;
}

// ============================================================================
// Response Processing
// ============================================================================

/**
 * Processes API responses into the output format.
 */
function processResponse(
  responses: readonly ImageInferenceApiResponse[],
): ImageInferenceOutput {
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
      ...(response.NSFWContent !== undefined && { nsfwContent: response.NSFWContent }),
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
 * Generates images using the Runware API.
 *
 * Supports:
 * - Text-to-image: Provide only positivePrompt
 * - Image-to-image: Add seedImage and strength
 * - Inpainting: Add seedImage and maskImage
 * - Outpainting: Add seedImage and outpaint config
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client (uses default if not provided)
 * @param context - Optional tool context for progress and cancellation
 * @returns Tool result with generated images
 */
export async function imageInference(
  input: ImageInferenceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    // Rate limit check
    await defaultRateLimiter.waitForToken(context?.signal);

    // Build request
    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('imageInference', requestParams);

    // Make API call
    const response = await runwareClient.request<ImageInferenceApiResponse>(
      [task],
      { signal: context?.signal },
    );

    // Process response
    const output = processResponse(response.data);
    const imageCount = output.images.length;

    // Return result
    const message = imageCount === 1
      ? 'Generated 1 image successfully'
      : `Generated ${String(imageCount)} images successfully`;

    return successResult(message, output, output.cost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

/**
 * MCP tool definition for image inference.
 */
export const imageInferenceToolDefinition = {
  name: 'imageInference',
  description:
    'Generate images from text prompts or transform existing images. Supports text-to-image, image-to-image, inpainting, and outpainting with ControlNet, LoRA, and identity preservation features.\n\n' +
    'Common use cases:\n' +
    '- Text-to-image: positivePrompt + model + dimensions\n' +
    '- Image-to-image: Add seedImage + strength\n' +
    '- Inpainting: Add seedImage + maskImage\n' +
    '- ControlNet: Add controlNet array for structural guidance\n\n' +
    'Docs: runware://docs/tools/image-inference | runware://docs/features/controlnet-guide | runware://docs/features/lora-guide | runware://docs/features/identity-preservation',
  inputSchema: {
    type: 'object',
    properties: {
      positivePrompt: {
        type: 'string',
        description: 'Text description of the desired image (2-3000 characters)',
      },
      model: {
        type: 'string',
        description: 'Model identifier in AIR format (e.g., "civitai:123@456")',
      },
      width: {
        type: 'number',
        description: 'Image width in pixels (512-2048, multiple of 64)',
        default: 1024,
      },
      height: {
        type: 'number',
        description: 'Image height in pixels (512-2048, multiple of 64)',
        default: 1024,
      },
      steps: {
        type: 'number',
        description: 'Number of diffusion steps (1-100)',
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention -- API parameter
      CFGScale: {
        type: 'number',
        description: 'Classifier-Free Guidance scale (0-50)',
      },
      seed: {
        type: 'number',
        description: 'Random seed for reproducible generation',
      },
      numberResults: {
        type: 'number',
        description: 'Number of images to generate (1-20)',
        default: 1,
      },
      negativePrompt: {
        type: 'string',
        description: 'Text describing what to avoid in the image',
      },
      seedImage: {
        type: 'string',
        description: 'Seed image for img2img/inpainting (UUID, URL, or base64)',
      },
      maskImage: {
        type: 'string',
        description: 'Mask image for inpainting (white = edit area)',
      },
      strength: {
        type: 'number',
        description: 'Denoising strength for img2img (0-1)',
      },
      outputType: {
        type: 'string',
        enum: ['URL', 'base64Data', 'dataURI'],
        description: 'How to return the generated image',
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
    required: ['positivePrompt', 'model'],
  },
} as const;
