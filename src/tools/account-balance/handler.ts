/**
 * Handler for the account balance tool.
 *
 * Retrieves the current Runware account credit balance.
 * This is a simple synchronous API call.
 */

import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import type { AccountBalanceInput, AccountBalanceOutput } from './schema.js';

// ============================================================================
// Types
// ============================================================================

interface AccountBalanceApiResponse {
  readonly taskType: 'accountBalance';
  readonly taskUUID: string;
  readonly balance?: number;
  readonly currency?: string;
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Retrieves the current account balance from Runware API.
 *
 * Simple synchronous call that returns the current credit balance.
 *
 * @param _input - Validated input parameters (empty object)
 * @param client - Optional Runware client
 * @param context - Optional tool context for cancellation
 * @returns Tool result with account balance
 */
export async function accountBalance(
  _input: AccountBalanceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    // Rate limit check
    await defaultRateLimiter.waitForToken(context?.signal);

    // Build request - no additional parameters needed
    const task = createTaskRequest('accountManagement', { operation: 'getDetails' });

    // Make API call (synchronous)
    const response = await runwareClient.requestSingle<AccountBalanceApiResponse>(task, {
      signal: context?.signal,
    });

    // Process response
    const output: AccountBalanceOutput = {
      balance: response.balance ?? 0,
      currency: response.currency ?? 'USD',
      retrievedAt: new Date().toISOString(),
    };

    // Return result with formatted message
    const formattedBalance = output.balance.toFixed(2);
    return successResult(
      `Current balance: ${output.currency} ${formattedBalance}`,
      output,
    );
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

/**
 * MCP tool definition for account balance.
 */
export const accountBalanceToolDefinition = {
  name: 'accountBalance',
  description: 'Check the current Runware account credit balance.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
} as const;
