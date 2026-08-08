import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import {
  type ToolContext,
  type ToolResult,
  errorResult,
  successResult,
} from '../../shared/types.js';
import { mapWithConcurrency, truncate } from '../../shared/utils.js';

import type {
  BatchImageInferenceOutput,
  BatchPromptResult,
  batchImageInferenceInputSchema,
} from './schema.js';
import type { z } from 'zod';

type BatchImageInferenceInputType = z.infer<typeof batchImageInferenceInputSchema>;

interface ImageInferenceApiResponse {
  readonly taskType: 'imageInference';
  readonly taskUUID: string;
  readonly imageUUID?: string;
  readonly imageURL?: string;
  readonly imageBase64Data?: string;
  readonly imageDataURI?: string;
  readonly seed?: number;
  readonly cost?: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API response property
  readonly NSFWContent?: boolean;
}

function buildApiRequest(
  prompt: string,
  input: BatchImageInferenceInputType,
): Record<string, unknown> {
  const request: Record<string, unknown> = {
    positivePrompt: prompt,
    model: input.model,
    width: input.width,
    height: input.height,
    numberResults: 1,
    includeCost: input.includeCost,
  };

  if (input.steps !== undefined) {
    request.steps = input.steps;
  }
  if (input.CFGScale !== undefined) {
    request.CFGScale = input.CFGScale;
  }
  if (input.negativePrompt !== undefined) {
    request.negativePrompt = input.negativePrompt;
  }
  if (input.scheduler !== undefined) {
    request.scheduler = input.scheduler;
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

async function processPrompt(
  prompt: string,
  index: number,
  input: BatchImageInferenceInputType,
  client: RunwareClient,
  context?: ToolContext,
): Promise<BatchPromptResult> {
  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(prompt, input);
    const task = createTaskRequest('imageInference', requestParams);

    const response = await client.requestSingle<ImageInferenceApiResponse>(
      task,
      { signal: context?.signal },
    );

    return {
      prompt,
      index,
      status: 'success',
      images: [
        {
          imageUUID: response.imageUUID ?? response.taskUUID,
          ...(response.imageURL !== undefined && { imageURL: response.imageURL }),
          ...(response.imageBase64Data !== undefined && { imageBase64Data: response.imageBase64Data }),
          ...(response.imageDataURI !== undefined && { imageDataURI: response.imageDataURI }),
          ...(response.seed !== undefined && { seed: response.seed }),
        },
      ],
      ...(response.cost !== undefined && { cost: response.cost }),
    };
  } catch (error) {
    const mcpError = wrapError(error);
    return {
      prompt,
      index,
      status: 'failed',
      error: mcpError.message,
    };
  }
}

export async function batchImageInference(
  input: BatchImageInferenceInputType,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    const { prompts, concurrency, stopOnError } = input;

    const results = await mapWithConcurrency(
      prompts,
      async (prompt, index) => {
        context?.progress?.report({
          progress: index,
          total: prompts.length,
          message: `Generating image ${String(index + 1)}/${String(prompts.length)}: "${truncate(prompt, 50)}"`,
        });

        if (context?.signal?.aborted === true) {
          return {
            prompt,
            index,
            status: 'failed' as const,
            error: 'Operation cancelled',
          };
        }

        const result = await processPrompt(prompt, index, input, runwareClient, context);

        if (stopOnError && result.status === 'failed') {
          throw new Error(`Generation failed for prompt ${String(index + 1)}: ${result.error ?? 'Unknown error'}`);
        }

        return result;
      },
      concurrency,
    );

    const successful = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const totalCost = results.reduce((sum, r) => sum + (r.cost ?? 0), 0);

    context?.progress?.report({
      progress: prompts.length,
      total: prompts.length,
      message: `Completed: ${String(successful)} successful, ${String(failed)} failed`,
    });

    const output: BatchImageInferenceOutput = {
      total: prompts.length,
      successful,
      failed,
      results,
      ...(input.includeCost && { totalCost }),
    };

    const allFailed = successful === 0 && failed > 0;
    const statusMessage = failed > 0
      ? `Generated ${String(successful)}/${String(prompts.length)} images with ${String(failed)} failures`
      : `Successfully generated ${String(successful)} images`;

    if (allFailed) {
      return errorResult(statusMessage, output);
    }

    return successResult(statusMessage, output, totalCost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const batchImageInferenceToolDefinition = {
  name: 'batchImageInference',
  description:
    'Generate multiple images from an array of prompts with shared settings. Ideal for creating variations or processing multiple ideas at once.\n\n' +
    'Usage: Provide 1-20 prompts with a shared model, dimensions, and quality settings. Each prompt generates one image concurrently (configurable 1-5).\n\n' +
    'Docs: runware://docs/guides/batch-processing',
  inputSchema: {
    type: 'object',
    properties: {
      prompts: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 20,
        description: 'Array of prompts to generate images for (1-20 prompts)',
      },
      model: {
        type: 'string',
        description: 'Model identifier in AIR format (e.g., civitai:123@456)',
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
      // eslint-disable-next-line @typescript-eslint/naming-convention -- API parameter name
      CFGScale: {
        type: 'number',
        description: 'Classifier-Free Guidance scale (0-50)',
      },
      negativePrompt: {
        type: 'string',
        description: 'Text describing what to avoid (applied to all prompts)',
      },
      scheduler: {
        type: 'string',
        description: 'Scheduler/sampler for diffusion process',
      },
      outputType: {
        type: 'string',
        enum: ['URL', 'base64Data', 'dataURI'],
        description: 'How to return the generated images',
      },
      outputFormat: {
        type: 'string',
        enum: ['JPG', 'PNG', 'WEBP'],
        description: 'Image format for output',
      },
      concurrency: {
        type: 'number',
        description: 'Number of prompts to process concurrently (1-5)',
        default: 2,
      },
      stopOnError: {
        type: 'boolean',
        description: 'Stop generation on first error',
        default: false,
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information in response',
        default: true,
      },
    },
    required: ['prompts', 'model'],
  },
} as const;
