/**
 * Handler for the model search tool.
 *
 * Searches for available models on the Runware platform.
 */

import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { modelSearchInputSchema, ModelSearchOutput } from './schema.js';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

type ModelSearchInput = z.infer<typeof modelSearchInputSchema>;

interface ModelSearchApiResult {
  readonly air: string;
  readonly name?: string;
  readonly version?: string;
  readonly category?: string;
  readonly architecture?: string;
  readonly type?: string;
  readonly tags?: readonly string[];
  readonly heroImage?: string;
  readonly private?: boolean;
  readonly defaultWidth?: number;
  readonly defaultHeight?: number;
  readonly defaultSteps?: number;
  readonly defaultScheduler?: string;
  readonly defaultCFG?: number;
  readonly defaultStrength?: number;
  readonly positiveTriggerWords?: readonly string[];
  readonly totalResults?: number;
}

// ============================================================================
// Request Building
// ============================================================================

function buildApiRequest(input: ModelSearchInput): Record<string, unknown> {
  // limit and offset have defaults from schema, so always include them
  const request: Record<string, unknown> = {
    limit: input.limit,
    offset: input.offset,
  };

  if (input.search !== undefined) {
    request.search = input.search;
  }
  if (input.tags !== undefined) {
    request.tags = input.tags;
  }
  if (input.category !== undefined) {
    request.category = input.category;
  }
  if (input.type !== undefined) {
    request.type = input.type;
  }
  if (input.architecture !== undefined) {
    request.architecture = input.architecture;
  }
  if (input.conditioning !== undefined) {
    request.conditioning = input.conditioning;
  }
  if (input.visibility !== undefined) {
    request.visibility = input.visibility;
  }

  return request;
}

// ============================================================================
// Response Processing
// ============================================================================

function processResponse(
  results: readonly ModelSearchApiResult[],
  input: ModelSearchInput,
): ModelSearchOutput {
  // Get total results from first item if available
  const totalResults = results.length > 0 && results[0]?.totalResults !== undefined
    ? results[0].totalResults
    : results.length;

  const models = results.map((result) => ({
    air: result.air,
    name: result.name ?? result.air,
    ...(result.version !== undefined && { version: result.version }),
    ...(result.category !== undefined && { category: result.category }),
    ...(result.architecture !== undefined && { architecture: result.architecture }),
    ...(result.type !== undefined && { type: result.type }),
    ...(result.tags !== undefined && { tags: [...result.tags] }),
    ...(result.heroImage !== undefined && { heroImage: result.heroImage }),
    ...(result.private !== undefined && { private: result.private }),
    ...(result.defaultWidth !== undefined && { defaultWidth: result.defaultWidth }),
    ...(result.defaultHeight !== undefined && { defaultHeight: result.defaultHeight }),
    ...(result.defaultSteps !== undefined && { defaultSteps: result.defaultSteps }),
    ...(result.defaultScheduler !== undefined && { defaultScheduler: result.defaultScheduler }),
    ...(result.defaultCFG !== undefined && { defaultCFG: result.defaultCFG }),
    ...(result.defaultStrength !== undefined && { defaultStrength: result.defaultStrength }),
    ...(result.positiveTriggerWords !== undefined && { positiveTriggerWords: [...result.positiveTriggerWords] }),
  }));

  // limit and offset always have default values from schema
  return {
    models,
    totalResults,
    offset: input.offset,
    limit: input.limit,
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Searches for models on the Runware platform.
 *
 * @param input - Search criteria
 * @param client - Optional Runware client
 * @param context - Optional tool context
 * @returns Tool result with matching models
 */
export async function modelSearch(
  input: ModelSearchInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('modelSearch', requestParams);

    const response = await runwareClient.request<ModelSearchApiResult>(
      [task],
      { signal: context?.signal },
    );

    const output = processResponse(response.data, input);

    const searchDescription = input.search === undefined
      ? ''
      : ` for "${input.search}"`;

    const message = output.models.length === 0
      ? `No models found${searchDescription}`
      : `Found ${String(output.totalResults)} model(s)${searchDescription}`;

    return successResult(message, output);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const modelSearchToolDefinition = {
  name: 'modelSearch',
  description:
    'Search for available AI models on the Runware platform by name, category, architecture, or tags.\n\n' +
    'Models use AIR format: provider:modelId@versionId (e.g., civitai:101195@128078). Results include defaultSteps, defaultCFG, and trigger words.\n\n' +
    'Docs: runware://docs/concepts/air-identifiers',
  inputSchema: {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'Search term for model names, versions, and tags',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags',
      },
      category: {
        type: 'string',
        enum: ['checkpoint', 'LoRA', 'Lycoris', 'ControlNet', 'VAE', 'embeddings'],
        description: 'Filter by category',
      },
      type: {
        type: 'string',
        enum: ['base', 'inpainting', 'refiner'],
        description: 'Filter by type (checkpoint only)',
      },
      architecture: {
        type: 'string',
        description: 'Filter by architecture (e.g., FLUX.1-dev, SDXL)',
      },
      limit: {
        type: 'number',
        description: 'Results per page (1-100)',
        default: 20,
      },
      offset: {
        type: 'number',
        description: 'Number of results to skip',
        default: 0,
      },
    },
    required: [],
  },
} as const;
