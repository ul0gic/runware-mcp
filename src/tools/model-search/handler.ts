import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { modelSearchInputSchema, ModelSearchOutput } from './schema.js';
import type { z } from 'zod';

type ModelSearchInput = z.infer<typeof modelSearchInputSchema>;
type ModelSearchResult = ModelSearchOutput['models'][number];

const CATEGORY_ALIASES = new Map<string, string>([
  ['LoRA', 'lora'],
  ['Lycoris', 'lycoris'],
  ['ControlNet', 'checkpoint'],
  ['VAE', 'vae'],
]);

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
  readonly capabilities?: readonly string[];
  readonly source?: 'featured' | 'community';
  readonly isFavorite?: boolean;
  readonly provider?: string;
  readonly shortDescription?: string;
}

/** The API may wrap models in a single data item, or return them flat — both shapes are modelled here. */
interface ModelSearchApiResult {
  readonly taskType?: string;
  readonly taskUUID?: string;
  readonly totalResults?: number;
  readonly results?: readonly ModelSearchApiModel[];
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
  readonly capabilities?: readonly string[];
  readonly source?: 'featured' | 'community';
  readonly isFavorite?: boolean;
  readonly provider?: string;
  readonly shortDescription?: string;
}

function buildApiRequest(input: ModelSearchInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    limit: input.limit,
    offset: input.offset,
  };

  if (input.search !== undefined) {
    request.search = input.search;
  }
  if (input.source !== undefined) {
    request.source = input.source;
  }
  if (input.tags !== undefined) {
    request.tags = input.tags;
  }
  if (input.category !== undefined) {
    request.category = CATEGORY_ALIASES.get(input.category) ?? input.category;
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
  if (input.capabilities !== undefined) {
    request.capabilities = input.capabilities;
  }
  if (input.visibility !== undefined) {
    request.visibility = input.visibility;
  }
  if (input.sort !== undefined) {
    request.sort = input.sort;
  }

  return request;
}

function mapModelDefaults(result: ModelSearchApiModel): Partial<ModelSearchResult> {
  return {
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

function mapModelMetadata(result: ModelSearchApiModel): Partial<ModelSearchResult> {
  return {
    ...(result.version !== undefined && { version: result.version }),
    ...(result.category !== undefined && { category: result.category }),
    ...(result.architecture !== undefined && { architecture: result.architecture }),
    ...(result.type !== undefined && { type: result.type }),
    ...(result.tags !== undefined && { tags: [...result.tags] }),
    ...(result.heroImage !== undefined && { heroImage: result.heroImage }),
    ...(result.private !== undefined && { private: result.private }),
    ...(result.capabilities !== undefined && { capabilities: [...result.capabilities] }),
    ...(result.source !== undefined && { source: result.source }),
    ...(result.isFavorite !== undefined && { isFavorite: result.isFavorite }),
    ...(result.provider !== undefined && { provider: result.provider }),
    ...(result.shortDescription !== undefined && {
      shortDescription: result.shortDescription,
    }),
  };
}

function mapModelResult(result: ModelSearchApiModel): ModelSearchResult {
  return {
    air: result.air,
    name: result.name ?? result.air,
    ...mapModelDefaults(result),
    ...mapModelMetadata(result),
  };
}

/** Handles both API shapes: a single wrapper item with `totalResults` plus nested `results`, or model objects directly in `data`. */
function processResponse(
  results: readonly ModelSearchApiResult[],
  input: ModelSearchInput,
): ModelSearchOutput {
  const limit = input.limit;
  const offset = input.offset;

  const firstResult = results.length > 0 ? results[0] : undefined;

  const nestedModels = firstResult?.results;
  if (nestedModels !== undefined) {
    const totalResults = firstResult?.totalResults ?? nestedModels.length;
    const models = nestedModels.map((m) => mapModelResult(m));

    return {
      models,
      totalResults,
      offset,
      limit,
    };
  }

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
      source: {
        type: 'string',
        enum: ['featured', 'community'],
        description: 'Filter by curated or community model source',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags',
      },
      category: {
        type: 'string',
        enum: ['checkpoint', 'lora', 'lycoris', 'vae', 'embeddings', 'LoRA', 'Lycoris', 'ControlNet', 'VAE'],
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
      conditioning: {
        type: 'string',
        description: 'Legacy ControlNet conditioning filter',
      },
      capabilities: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by capability identifiers',
      },
      visibility: {
        type: 'string',
        enum: ['public', 'private', 'favorite', 'owned', 'all'],
      },
      sort: {
        type: 'string',
        enum: [
          'popularity',
          '-popularity',
          'name',
          '-name',
          'addedUnixTimestamp',
          '-addedUnixTimestamp',
          'updatedDateUnixTimestamp',
          '-updatedDateUnixTimestamp',
        ],
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
