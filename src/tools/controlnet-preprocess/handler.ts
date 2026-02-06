/**
 * Handler for the ControlNet preprocess tool.
 *
 * Implements ControlNet preprocessing using the Runware API.
 * Transforms input images into guide images for controlled generation.
 */

import { getPreprocessor, isValidApiPreprocessor } from '../../constants/controlnet.js';
import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { RunwareApiError, wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import type { ControlNetPreprocessInput, ControlNetPreprocessOutput } from './schema.js';

// ============================================================================
// Types
// ============================================================================

interface ControlNetPreprocessApiResponse {
  readonly taskType: 'imageControlNetPreProcess';
  readonly taskUUID: string;
  readonly guideImageUUID?: string;
  readonly inputImageUUID?: string;
  readonly guideImageURL?: string;
  readonly guideImageBase64Data?: string;
  readonly guideImageDataURI?: string;
  readonly cost?: number;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates the preprocessor type.
 */
function validatePreprocessor(preprocessor: string): void {
  // Check both internal and API format
  const preprocessorInfo = getPreprocessor(preprocessor);

  if (preprocessorInfo === undefined && !isValidApiPreprocessor(preprocessor)) {
    throw new RunwareApiError(
      `Invalid preprocessor: ${preprocessor}. Valid preprocessors: canny, depth, mlsd, normalbae, openpose, tile, seg, lineart, lineart_anime, shuffle, scribble, softedge`,
      { apiCode: 'INVALID_PREPROCESSOR' },
    );
  }
}

/**
 * Gets the API identifier for a preprocessor.
 */
function getApiPreprocessorId(preprocessor: string): string {
  const info = getPreprocessor(preprocessor);
  return info?.apiId ?? preprocessor;
}

// ============================================================================
// Request Building
// ============================================================================

/**
 * Builds the API request from validated input.
 */
function buildApiRequest(input: ControlNetPreprocessInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    inputImage: input.inputImage,
    preProcessorType: getApiPreprocessorId(input.preprocessor),
    includeCost: input.includeCost,
  };

  // Optional dimension parameters
  if (input.height !== undefined) {
    request.height = input.height;
  }
  if (input.width !== undefined) {
    request.width = input.width;
  }

  // Output parameters
  if (input.outputType !== undefined) {
    request.outputType = input.outputType;
  }
  if (input.outputFormat !== undefined) {
    request.outputFormat = input.outputFormat;
  }
  if (input.outputQuality !== undefined) {
    request.outputQuality = input.outputQuality;
  }

  // Canny-specific parameters
  if (input.lowThresholdCanny !== undefined) {
    request.lowThresholdCanny = input.lowThresholdCanny;
  }
  if (input.highThresholdCanny !== undefined) {
    request.highThresholdCanny = input.highThresholdCanny;
  }

  // OpenPose-specific parameters
  if (input.includeHandsAndFaceOpenPose !== undefined) {
    request.includeHandsAndFaceOpenPose = input.includeHandsAndFaceOpenPose;
  }

  return request;
}

// ============================================================================
// Response Processing
// ============================================================================

/**
 * Processes API response into the output format.
 */
function processResponse(response: ControlNetPreprocessApiResponse): ControlNetPreprocessOutput {
  return {
    guideImageUUID: response.guideImageUUID ?? response.taskUUID,
    ...(response.inputImageUUID !== undefined && { inputImageUUID: response.inputImageUUID }),
    ...(response.guideImageURL !== undefined && { guideImageURL: response.guideImageURL }),
    ...(response.guideImageBase64Data !== undefined && {
      guideImageBase64Data: response.guideImageBase64Data,
    }),
    ...(response.guideImageDataURI !== undefined && {
      guideImageDataURI: response.guideImageDataURI,
    }),
    ...(response.cost !== undefined && { cost: response.cost }),
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Preprocesses an image for ControlNet using the Runware API.
 *
 * Transforms input images into guide images that can be used
 * for controlled image generation with ControlNet.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client
 * @param context - Optional tool context for progress and cancellation
 * @returns Tool result with preprocessed guide image
 */
export async function controlNetPreprocess(
  input: ControlNetPreprocessInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    // Validate preprocessor
    validatePreprocessor(input.preprocessor);

    // Rate limit check
    await defaultRateLimiter.waitForToken(context?.signal);

    // Build request
    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('imageControlNetPreProcess', requestParams);

    // Make API call (synchronous)
    const response = await runwareClient.requestSingle<ControlNetPreprocessApiResponse>(task, {
      signal: context?.signal,
    });

    // Process response
    const output = processResponse(response);

    // Return result
    const preprocessorInfo = getPreprocessor(input.preprocessor);
    const preprocessorName = preprocessorInfo?.name ?? input.preprocessor;
    return successResult(
      `Image preprocessed with ${preprocessorName} successfully`,
      output,
      output.cost,
    );
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

/**
 * MCP tool definition for ControlNet preprocess.
 */
export const controlNetPreprocessToolDefinition = {
  name: 'controlNetPreprocess',
  description:
    'Preprocess images for ControlNet-guided generation. Supports edge detection, depth maps, pose estimation, and more.\n\n' +
    'Preprocessors: canny (edges), depth (depth map), mlsd (lines), normalbae (normals), openpose (body pose), tile (detail), seg (segmentation), lineart, lineart_anime, shuffle, scribble, softedge\n\n' +
    'Docs: runware://docs/tools/controlnet-preprocess | runware://docs/features/controlnet-guide',
  inputSchema: {
    type: 'object',
    properties: {
      inputImage: {
        type: 'string',
        description: 'Image to preprocess (UUID, URL, or base64)',
      },
      preprocessor: {
        type: 'string',
        enum: [
          'canny',
          'depth',
          'mlsd',
          'normalbae',
          'openpose',
          'tile',
          'seg',
          'lineart',
          'lineart_anime',
          'shuffle',
          'scribble',
          'softedge',
        ],
        description: 'Preprocessing algorithm',
      },
      height: {
        type: 'number',
        description: 'Output height (optional resize)',
      },
      width: {
        type: 'number',
        description: 'Output width (optional resize)',
      },
      lowThresholdCanny: {
        type: 'number',
        description: 'Low threshold for Canny (0-255)',
      },
      highThresholdCanny: {
        type: 'number',
        description: 'High threshold for Canny (0-255)',
      },
      includeHandsAndFaceOpenPose: {
        type: 'boolean',
        description: 'Include detailed hand/face pose (OpenPose only)',
      },
      outputType: {
        type: 'string',
        enum: ['URL', 'base64Data', 'dataURI'],
        description: 'How to return the image',
      },
      outputFormat: {
        type: 'string',
        enum: ['JPG', 'PNG', 'WEBP'],
        description: 'Image format',
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information',
        default: true,
      },
    },
    required: ['inputImage', 'preprocessor'],
  },
} as const;
