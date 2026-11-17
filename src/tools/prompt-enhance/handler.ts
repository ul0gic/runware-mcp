// Does:  Expands a short prompt into one to five enhanced variations.
// Holds: Issues one request per requested version in parallel; cost is the sum and is omitted when zero.

import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import type { PromptEnhanceInput, PromptEnhanceOutput } from './schema.js';

interface PromptEnhanceApiResponse {
  readonly taskType: 'promptEnhance';
  readonly taskUUID: string;
  readonly text: string;
  readonly cost?: number;
}

function buildApiRequest(input: PromptEnhanceInput): Record<string, unknown> {
  return {
    prompt: input.prompt,
    promptVersions: input.promptVersions,
    promptMaxLength: input.promptMaxLength,
    includeCost: input.includeCost,
  };
}

export async function promptEnhance(
  input: PromptEnhanceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    if (context?.signal?.aborted === true) {
      throw new Error('Operation cancelled');
    }

    // Why: The API returns a single result per request, so each version needs its own call.
    const requestParams = buildApiRequest(input);
    const responses = await Promise.all(
      Array.from({ length: input.promptVersions }, () =>
        runwareClient.requestSingle<PromptEnhanceApiResponse>(createTaskRequest('promptEnhance', requestParams), {
          signal: context?.signal,
        }),
      ),
    );

    const enhancedPrompts = responses.map((response) => response.text);
    const totalCost = responses.reduce((sum, response) => sum + (response.cost ?? 0), 0);

    const output: PromptEnhanceOutput = {
      enhancedPrompts,
      ...(totalCost > 0 && { cost: totalCost }),
    };

    const versionsText = input.promptVersions === 1 ? '1 variation' : `${String(input.promptVersions)} variations`;
    return successResult(`Prompt enhanced successfully (${versionsText})`, output, output.cost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const promptEnhanceToolDefinition = {
  name: 'promptEnhance',
  description:
    'Enhance prompts with AI-generated keywords for better image generation results. Generates 1-5 variations.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Input prompt to enhance (max 300 chars)',
      },
      promptVersions: {
        type: 'number',
        description: 'Number of enhanced variations (1-5)',
        default: 1,
      },
      promptMaxLength: {
        type: 'number',
        description: 'Maximum length in tokens (5-400, ~100 tokens = 75 words)',
        default: 200,
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information',
        default: true,
      },
    },
    required: ['prompt'],
  },
} as const;
