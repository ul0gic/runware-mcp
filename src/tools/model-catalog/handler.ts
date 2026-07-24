import {
  getCuratedModel,
  getModelExamples as fetchModelExamples,
  getModelPricing as fetchModelPricing,
  listCapabilities as fetchCapabilities,
  listCuratedModels,
} from '../../integrations/runware/content.js';
import { getModelSchema as fetchModelSchema } from '../../integrations/runware/schema-registry.js';
import { wrapError } from '../../shared/errors.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import type {
  ListModelsInput,
  ModelExamplesInput,
  ModelIdentifierInput,
  ModelSchemaInput,
} from './schema.js';

export async function listModels(
  input: ListModelsInput,
  _client?: unknown,
  context?: ToolContext,
): Promise<ToolResult> {
  try {
    const models = await listCuratedModels(input, context?.signal);
    return successResult(`Found ${String(models.length)} curated model(s)`, { models });
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export async function modelDetails(
  input: ModelIdentifierInput,
  _client?: unknown,
  context?: ToolContext,
): Promise<ToolResult> {
  try {
    const model = await getCuratedModel(input.air, context?.signal);
    return model === undefined
      ? errorResult(`No curated model found for ${input.air}`)
      : successResult(`Found model details for ${input.air}`, model);
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export async function modelExamples(
  input: ModelExamplesInput,
  _client?: unknown,
  context?: ToolContext,
): Promise<ToolResult> {
  try {
    const examples = await fetchModelExamples(input.air, input.capability, context?.signal);
    return successResult(`Found ${String(examples.length)} example(s) for ${input.air}`, {
      examples,
    });
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export async function modelPricing(
  input: ModelIdentifierInput,
  _client?: unknown,
  context?: ToolContext,
): Promise<ToolResult> {
  try {
    const pricing = await fetchModelPricing(input.air, context?.signal);
    return pricing === undefined
      ? errorResult(`No pricing found for ${input.air}`)
      : successResult(`Found pricing for ${input.air}`, pricing);
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export async function listCapabilities(
  _input: Record<string, never>,
  _client?: unknown,
  context?: ToolContext,
): Promise<ToolResult> {
  try {
    const capabilities = await fetchCapabilities(context?.signal);
    return successResult(`Found ${String(capabilities.length)} capabilities`, { capabilities });
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export async function modelSchema(
  input: ModelSchemaInput,
  _client?: unknown,
  context?: ToolContext,
): Promise<ToolResult> {
  try {
    const schema = await fetchModelSchema(input.model, context?.signal);
    return schema === undefined
      ? errorResult(`No schema found for ${input.model}`)
      : successResult(`Found request schema for ${input.model}`, { model: input.model, schema });
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export const listModelsToolDefinition = {
  name: 'listModels',
  description: 'List Runware curated models by capability, modality, creator, or search term.',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: {
      capability: { type: 'string' },
      category: { type: 'string', enum: ['image', 'video', 'audio', 'text', '3d'] },
      creator: { type: 'string' },
      search: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
  },
} as const;

export const modelDetailsToolDefinition = {
  name: 'modelDetails',
  description: 'Get current curated metadata for a model by AIR identifier or catalog slug.',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: { air: { type: 'string' } },
    required: ['air'],
  },
} as const;

export const modelExamplesToolDefinition = {
  name: 'modelExamples',
  description: 'Get working request and output examples for a curated model.',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: {
      air: { type: 'string' },
      capability: { type: 'string' },
    },
    required: ['air'],
  },
} as const;

export const modelPricingToolDefinition = {
  name: 'modelPricing',
  description: 'Get current pricing information for a curated model.',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: { air: { type: 'string' } },
    required: ['air'],
  },
} as const;

export const listCapabilitiesToolDefinition = {
  name: 'listCapabilities',
  description: 'List the current Runware capability taxonomy used to filter models.',
  annotations: { readOnlyHint: true },
  inputSchema: { type: 'object', properties: {}, required: [] },
} as const;

export const modelSchemaToolDefinition = {
  name: 'modelSchema',
  description: 'Fetch the live JSON Schema for a Runware model before inference.',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: { model: { type: 'string' } },
    required: ['model'],
  },
} as const;
