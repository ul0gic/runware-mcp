import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
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

    const enhancedPrompts: string[] = [];
    let totalCost = 0;

    // The API returns a single result per request, so each version needs its own call.
    const requestParams = buildApiRequest(input);

    const versionsToGenerate = input.promptVersions;

    for (let i = 0; i < versionsToGenerate; i++) {
      const task = createTaskRequest('promptEnhance', requestParams);

      if (context?.signal?.aborted === true) {
        throw new Error('Operation cancelled');
      }

      const response = await runwareClient.requestSingle<PromptEnhanceApiResponse>(task, {
        signal: context?.signal,
      });

      enhancedPrompts.push(response.text);

      if (response.cost !== undefined) {
        totalCost += response.cost;
      }
    }

    const output: PromptEnhanceOutput = {
      enhancedPrompts,
      ...(totalCost > 0 && { cost: totalCost }),
    };

    const versionsText = versionsToGenerate === 1 ? '1 variation' : `${String(versionsToGenerate)} variations`;
    return successResult(
      `Prompt enhanced successfully (${versionsText})`,
      output,
      output.cost,
    );
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
