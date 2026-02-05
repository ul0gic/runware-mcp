/**
 * Handler for the get video model info tool.
 *
 * This is a local tool that returns detailed information
 * about a specific video model.
 */

import { getVideoModel } from '../../constants/video-models.js';
import { type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { getVideoModelInfoInputSchema, GetVideoModelInfoOutput } from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

type GetVideoModelInfoInput = z.infer<typeof getVideoModelInfoInputSchema>;

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Gets detailed information about a specific video model.
 *
 * This is a local operation that doesn't call the API.
 *
 * @param input - Model identifier
 * @returns Tool result with model information
 */
export function getVideoModelInfo(
  input: GetVideoModelInfoInput,
): ToolResult {
  const model = getVideoModel(input.modelId);

  if (model === undefined) {
    return errorResult(
      `Video model not found: ${input.modelId}`,
      { modelId: input.modelId },
    );
  }

  const output: GetVideoModelInfoOutput = {
    id: model.id,
    name: model.name,
    provider: model.provider,
    maxWidth: model.maxWidth,
    maxHeight: model.maxHeight,
    minDuration: model.minDuration,
    maxDuration: model.maxDuration,
    supportsFPS: model.supportsFPS,
    ...(model.defaultFPS !== undefined && { defaultFPS: model.defaultFPS }),
    supportsAudio: model.supportsAudio,
    supportsImageInput: model.supportsImageInput,
    supportsVideoInput: model.supportsVideoInput,
    features: [...model.features],
    ...(model.costPerSecond !== undefined && { costPerSecond: model.costPerSecond }),
    ...(model.notes !== undefined && { notes: model.notes }),
  };

  return successResult(`Video model: ${model.name}`, output);
}

export const getVideoModelInfoToolDefinition = {
  name: 'getVideoModelInfo',
  description: 'Get detailed information about a specific video generation model.',
  inputSchema: {
    type: 'object',
    properties: {
      modelId: {
        type: 'string',
        description: 'Model identifier (e.g., "klingai:1.5@2")',
      },
    },
    required: ['modelId'],
  },
} as const;
