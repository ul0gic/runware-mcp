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

function validatePreprocessor(preprocessor: string): void {
  // Accepts both the internal preprocessor name and the raw API identifier.
  const preprocessorInfo = getPreprocessor(preprocessor);

  if (preprocessorInfo === undefined && !isValidApiPreprocessor(preprocessor)) {
    throw new RunwareApiError(
      `Invalid preprocessor: ${preprocessor}. Valid preprocessors: canny, depth, mlsd, normalbae, openpose, tile, seg, lineart, lineart_anime, shuffle, scribble, softedge`,
      { apiCode: 'INVALID_PREPROCESSOR' },
    );
  }
}

function getApiPreprocessorId(preprocessor: string): string {
  const info = getPreprocessor(preprocessor);
  return info?.apiId ?? preprocessor;
}

function buildApiRequest(input: ControlNetPreprocessInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    inputImage: input.inputImage,
    preProcessorType: getApiPreprocessorId(input.preprocessor),
    includeCost: input.includeCost,
  };

  if (input.height !== undefined) {
    request.height = input.height;
  }
  if (input.width !== undefined) {
    request.width = input.width;
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

  if (input.lowThresholdCanny !== undefined) {
    request.lowThresholdCanny = input.lowThresholdCanny;
  }
  if (input.highThresholdCanny !== undefined) {
    request.highThresholdCanny = input.highThresholdCanny;
  }

  if (input.includeHandsAndFaceOpenPose !== undefined) {
    request.includeHandsAndFaceOpenPose = input.includeHandsAndFaceOpenPose;
  }

  return request;
}

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

export async function controlNetPreprocess(
  input: ControlNetPreprocessInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    validatePreprocessor(input.preprocessor);

    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('imageControlNetPreProcess', requestParams);

    const response = await runwareClient.requestSingle<ControlNetPreprocessApiResponse>(task, {
      signal: context?.signal,
    });

    const output = processResponse(response);

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
