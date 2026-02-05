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

/**
 * Individual model result from the API.
 */
interface ModelSearchApiModel {
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
  readonly positiveTriggerWords?: string | readonly string[];
}

/**
 * Raw API response item for model search.
 *
 * The API returns a single data item containing totalResults and
 * an array of model objects, rather than returning models directly
 * in the data array.
 */
interface ModelSearchApiResult {
  readonly taskType?: string;
  readonly taskUUID?: string;
  readonly totalResults?: number;
  readonly results?: readonly ModelSearchApiModel[];
  // Flat model fields (for backwards compatibility if API returns flat items)
  readonly air?: string;
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
  readonly positiveTriggerWords?: string | readonly string[];
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

/**
 * Maps a single model API result to the output format.
 */
function mapModelResult(result: ModelSearchApiModel): ModelSearchOutput['models'][number] {
  return {
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
    ...(result.positiveTriggerWords !== undefined && {
      positiveTriggerWords: typeof result.positiveTriggerWords === 'string'
        ? [result.positiveTriggerWords]
        : [...result.positiveTriggerWords],
    }),
  };
}

/**
 * Extracts model data from the API response.
 *
 * The API can return results in two formats:
 * 1. Wrapper format: data contains a single item with `totalResults` and nested `models` array
 * 2. Flat format: data contains model objects directly (each with `air`, `name`, etc.)
 *
 * This function handles both transparently.
 */
function processResponse(
  results: readonly ModelSearchApiResult[],
  input: ModelSearchInput,
): ModelSearchOutput {
  const limit = input.limit;
  const offset = input.offset;

  // Check if the API returned a wrapper format (single item with nested models array)
  const firstResult = results.length > 0 ? results[0] : undefined;

  const nestedModels = firstResult?.results;
  if (nestedModels !== undefined) {
    // Wrapper format: extract models from the nested array
    const totalResults = firstResult?.totalResults ?? nestedModels.length;
    const models = nestedModels.map((m) => mapModelResult(m));

    return {
      models,
      totalResults,
      offset,
      limit,
    };
  }

  // Flat format: each item in data is a model (filter out items without 'air' field)
  const flatModels = results.filter((r): r is ModelSearchApiResult & { readonly air: string } => r.air !== undefined);
  const totalResults = firstResult?.totalResults ?? flatModels.length;
  const models = flatModels.map((m) => mapModelResult(m));

  return {
    models,
    totalResults,
    offset,
    limit,
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
