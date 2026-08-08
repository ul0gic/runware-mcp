import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { pollForResult } from '../../integrations/runware/polling.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, type TaskUUID, successResult, errorResult } from '../../shared/types.js';

import type { videoInferenceInputSchema, VideoInferenceOutput } from './schema.js';
import type { z } from 'zod';

type VideoInferenceInput = z.infer<typeof videoInferenceInputSchema>;

interface VideoInferenceApiResponse {
  readonly taskType: 'videoInference';
  readonly taskUUID: string;
  readonly status?: 'processing' | 'success' | 'error';
  readonly videoUUID?: string;
  readonly videoURL?: string;
  readonly seed?: number;
  readonly cost?: number;
}

/** Keys are compile-time constants, not user input. */
function addOptionalParams(
  request: Record<string, unknown>,
  input: VideoInferenceInput,
  keys: readonly (keyof VideoInferenceInput)[],
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

function addDimensionParams(request: Record<string, unknown>, input: VideoInferenceInput): void {
  addOptionalParams(request, input, ['width', 'height']);
}

function addQualityParams(request: Record<string, unknown>, input: VideoInferenceInput): void {
  addOptionalParams(request, input, ['fps', 'steps', 'CFGScale', 'seed']);
}

function addFrameParams(request: Record<string, unknown>, input: VideoInferenceInput): void {
  addOptionalParams(request, input, [
    'frameImages',
    'referenceImages',
    'referenceVideos',
    'inputAudios',
    'speech',
    'lora',
  ]);
}

function addProviderParams(request: Record<string, unknown>, input: VideoInferenceInput): void {
  if (input.alibaba !== undefined) {
    Object.assign(request, input.alibaba);
  }
  if (input.klingai !== undefined) {
    Object.assign(request, input.klingai);
  }
  if (input.pixverse !== undefined) {
    Object.assign(request, input.pixverse);
  }
  if (input.veo !== undefined) {
    Object.assign(request, input.veo);
  }
  if (input.sync !== undefined) {
    Object.assign(request, input.sync);
  }
}

function addOutputParams(request: Record<string, unknown>, input: VideoInferenceInput): void {
  addOptionalParams(request, input, ['outputFormat', 'outputQuality', 'outputType', 'safety']);
  // includeCost always has a default value from schema
  request.includeCost = input.includeCost;
}

function buildApiRequest(input: VideoInferenceInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    positivePrompt: input.positivePrompt,
    model: input.model,
    duration: input.duration,
    deliveryMethod: 'async',
  };

  addDimensionParams(request, input);
  addQualityParams(request, input);
  addFrameParams(request, input);
  addProviderParams(request, input);
  addOutputParams(request, input);

  return request;
}

function processResponse(
  response: VideoInferenceApiResponse,
  pollingAttempts: number,
  elapsedMs: number,
): VideoInferenceOutput {
  return {
    videoUUID: response.videoUUID ?? response.taskUUID,
    ...(response.videoURL !== undefined && { videoURL: response.videoURL }),
    ...(response.seed !== undefined && { seed: response.seed }),
    ...(response.cost !== undefined && { cost: response.cost }),
    pollingAttempts,
    elapsedMs,
  };
}

/** Always async: the submit is acknowledged, then the video arrives via polling. */
export async function videoInference(
  input: VideoInferenceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('videoInference', requestParams);

    await runwareClient.requestSingle<VideoInferenceApiResponse>(
      task,
      { signal: context?.signal },
    );

    context?.progress?.report({
      progress: 0,
      total: 100,
      message: 'Video generation task submitted, polling for result...',
    });

    const pollResult = await pollForResult<VideoInferenceApiResponse>(
      task.taskUUID as TaskUUID,
      {
        client: runwareClient,
        signal: context?.signal,
        progress: context?.progress,
      },
    );

    const output = processResponse(
      pollResult.result,
      pollResult.attempts,
      pollResult.elapsedMs,
    );

    context?.progress?.report({
      progress: 100,
      total: 100,
      message: 'Video generation complete',
    });

    const elapsedSeconds = Math.round((output.elapsedMs ?? 0) / 1000);
    return successResult(
      `Video generated successfully in ${String(elapsedSeconds)}s (${String(output.pollingAttempts)} poll attempts)`,
      output,
      output.cost,
    );
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const videoInferenceToolDefinition = {
  name: 'videoInference',
  description:
    'Generate videos from text prompts or transform existing images/videos. Supports multiple providers including KlingAI, Veo, PixVerse, and more.\n\n' +
    'Providers: KlingAI (audio, camera control), Veo (prompt enhancement), PixVerse (viral effects, camera movements), Alibaba/Wan (shot composition), Sync.so (lip sync)\n\n' +
    'Docs: runware://docs/tools/video-inference | runware://docs/guides/choosing-providers',
  inputSchema: {
    type: 'object',
    properties: {
      positivePrompt: {
        type: 'string',
        description: 'Text description of the desired video',
      },
      model: {
        type: 'string',
        description: 'Video model identifier (e.g., "klingai:1.5@2")',
      },
      duration: {
        type: 'number',
        description: 'Video duration in seconds (1-10)',
      },
      width: {
        type: 'number',
        description: 'Video width in pixels (256-1920)',
      },
      height: {
        type: 'number',
        description: 'Video height in pixels (256-1080)',
      },
      fps: {
        type: 'number',
        description: 'Frames per second (15-60)',
      },
      seed: {
        type: 'number',
        description: 'Random seed for reproducible generation',
      },
      frameImages: {
        type: 'array',
        description: 'Constrained frame images for image-to-video',
        items: {
          type: 'object',
          properties: {
            inputImage: { type: 'string' },
            frame: { type: ['string', 'number'] },
          },
        },
      },
      outputFormat: {
        type: 'string',
        enum: ['MP4', 'WEBM', 'MOV'],
        description: 'Video output format',
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information',
        default: true,
      },
    },
    required: ['positivePrompt', 'model', 'duration'],
  },
} as const;
