/**
 * Handler for the list video models tool.
 *
 * This is a local tool that returns video model information
 * from the constants, without making an API call.
 */

import {
  VIDEO_MODELS,
  type VideoModel,
} from '../../constants/video-models.js';
import { type ToolResult, successResult } from '../../shared/types.js';

import type { listVideoModelsInputSchema, ListVideoModelsOutput } from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

type ListVideoModelsInput = z.infer<typeof listVideoModelsInputSchema>;

// ============================================================================
// Filtering
// ============================================================================

/**
 * Filters video models based on input criteria.
 */
function filterModels(input: ListVideoModelsInput): VideoModel[] {
  let models = Object.values(VIDEO_MODELS) as VideoModel[];

  // Filter by provider
  if (input.provider !== undefined) {
    models = models.filter((model) => model.provider === input.provider);
  }

  // Filter by minimum duration
  if (input.minDuration !== undefined) {
    const minDuration = input.minDuration;
    models = models.filter((model) => model.maxDuration >= minDuration);
  }

  // Filter by audio support
  if (input.supportsAudio !== undefined) {
    models = models.filter((model) => model.supportsAudio === input.supportsAudio);
  }

  // Filter by image input support
  if (input.supportsImageInput !== undefined) {
    models = models.filter((model) => model.supportsImageInput === input.supportsImageInput);
  }

  // Filter by video input support
  if (input.supportsVideoInput !== undefined) {
    models = models.filter((model) => model.supportsVideoInput === input.supportsVideoInput);
  }

  // Filter by feature
  if (input.feature !== undefined) {
    const feature = input.feature.toLowerCase();
    models = models.filter((model) =>
      model.features.some((f) => f.toLowerCase().includes(feature)),
    );
  }

  // Filter by minimum resolution
  if (input.minWidth !== undefined) {
    const minWidth = input.minWidth;
    models = models.filter((model) => model.maxWidth >= minWidth);
  }
  if (input.minHeight !== undefined) {
    const minHeight = input.minHeight;
    models = models.filter((model) => model.maxHeight >= minHeight);
  }

  return models;
}

/**
 * Converts a VideoModel to a summary object.
 */
function toSummary(model: VideoModel): ListVideoModelsOutput['models'][number] {
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    maxWidth: model.maxWidth,
    maxHeight: model.maxHeight,
    minDuration: model.minDuration,
    maxDuration: model.maxDuration,
    supportsAudio: model.supportsAudio,
    supportsImageInput: model.supportsImageInput,
    supportsVideoInput: model.supportsVideoInput,
    features: [...model.features],
    ...(model.costPerSecond !== undefined && { costPerSecond: model.costPerSecond }),
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Lists video models with optional filtering.
 *
 * This is a local operation that doesn't call the API.
 *
 * @param input - Filter criteria
 * @returns Tool result with matching models
 */
export function listVideoModels(
  input: ListVideoModelsInput,
): ToolResult {
  const models = filterModels(input);

  // Get unique providers sorted
  const providersSet = new Set(models.map((m) => m.provider));
  const providers = [...providersSet].toSorted((a, b) => a.localeCompare(b));

  const output: ListVideoModelsOutput = {
    models: models.map((model) => toSummary(model)),
    count: models.length,
    providers,
  };

  const filterDescription = buildFilterDescription(input);
  const message = models.length === 0
    ? `No video models found${filterDescription}`
    : `Found ${String(models.length)} video model(s)${filterDescription}`;

  return successResult(message, output);
}

/**
 * Builds a description of the applied filters.
 */
function buildFilterDescription(input: ListVideoModelsInput): string {
  const filters: string[] = [];

  if (input.provider !== undefined) {
    filters.push(`provider: ${input.provider}`);
  }
  if (input.minDuration !== undefined) {
    filters.push(`min duration: ${String(input.minDuration)}s`);
  }
  if (input.supportsAudio === true) {
    filters.push('with audio');
  }
  if (input.supportsImageInput === true) {
    filters.push('with image input');
  }
  if (input.supportsVideoInput === true) {
    filters.push('with video input');
  }
  if (input.feature !== undefined) {
    filters.push(`feature: ${input.feature}`);
  }

  if (filters.length === 0) {
    return '';
  }

  return ` (${filters.join(', ')})`;
}

export const listVideoModelsToolDefinition = {
  name: 'listVideoModels',
  description: 'List available video generation models with optional filtering by provider, duration, audio support, and features.',
  inputSchema: {
    type: 'object',
    properties: {
      provider: {
        type: 'string',
        enum: ['klingai', 'google', 'minimax', 'pixverse', 'vidu', 'alibaba', 'runway', 'seedance', 'sync'],
        description: 'Filter by provider',
      },
      minDuration: {
        type: 'number',
        description: 'Filter by minimum duration support (seconds)',
      },
      supportsAudio: {
        type: 'boolean',
        description: 'Filter to models that support audio',
      },
      supportsImageInput: {
        type: 'boolean',
        description: 'Filter to models that support image input',
      },
      supportsVideoInput: {
        type: 'boolean',
        description: 'Filter to models that support video input',
      },
      feature: {
        type: 'string',
        description: 'Filter by specific feature (e.g., "1080p", "camera-control")',
      },
    },
    required: [],
  },
} as const;
