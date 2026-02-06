/**
 * Handler for the prompt enhance tool.
 *
 * Implements prompt enhancement using the Runware API.
 * This enriches prompts with additional descriptive keywords
 * to improve image generation results.
 */

import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import type { PromptEnhanceInput, PromptEnhanceOutput } from './schema.js';

// ============================================================================
// Types
// ============================================================================

interface PromptEnhanceApiResponse {
  readonly taskType: 'promptEnhance';
  readonly taskUUID: string;
  readonly text: string;
  readonly cost?: number;
}

// ============================================================================
// Request Building
// ============================================================================

/**
 * Builds the API request from validated input.
 */
function buildApiRequest(input: PromptEnhanceInput): Record<string, unknown> {
  return {
    prompt: input.prompt,
    promptVersions: input.promptVersions,
    promptMaxLength: input.promptMaxLength,
    includeCost: input.includeCost,
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Enhances a prompt using the Runware API.
 *
 * Takes an input prompt and enriches it with additional descriptive
 * keywords to improve image generation results. Can generate multiple
 * variations of the enhanced prompt.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client
 * @param context - Optional tool context for progress and cancellation
 * @returns Tool result with enhanced prompts
 */
export async function promptEnhance(
  input: PromptEnhanceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    // Rate limit check
    await defaultRateLimiter.waitForToken(context?.signal);

    // Collect all enhanced prompts
    const enhancedPrompts: string[] = [];
    let totalCost = 0;

    // Build request - API returns one result per request
    // For multiple versions, we make multiple requests
    const requestParams = buildApiRequest(input);

    // Make requests for each version
    // promptVersions always has a default value from schema
    const versionsToGenerate = input.promptVersions;

    for (let i = 0; i < versionsToGenerate; i++) {
      const task = createTaskRequest('promptEnhance', requestParams);

      // Check for cancellation
      if (context?.signal?.aborted === true) {
        throw new Error('Operation cancelled');
      }

      // Make API call (synchronous)
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

    // Return result
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

/**
 * MCP tool definition for prompt enhance.
 */
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
