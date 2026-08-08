import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import type { AccountBalanceInput, AccountBalanceOutput } from './schema.js';

interface AccountBalanceApiResponse {
  readonly taskType: 'accountManagement' | 'accountBalance';
  readonly taskUUID: string;
  readonly balance?: number | {
    readonly amount?: number;
    readonly freeBalance?: number;
    readonly currency?: string;
  };
  readonly currency?: string;
}

export async function accountBalance(
  _input: AccountBalanceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const task = createTaskRequest('accountManagement', { operation: 'getDetails' });

    const response = await runwareClient.requestSingle<AccountBalanceApiResponse>(task, {
      signal: context?.signal,
    });

    const currentBalance = typeof response.balance === 'object'
      ? response.balance.amount
      : response.balance;
    const currentCurrency = typeof response.balance === 'object'
      ? response.balance.currency
      : response.currency;

    const output: AccountBalanceOutput = {
      balance: currentBalance ?? 0,
      currency: currentCurrency ?? 'USD',
      retrievedAt: new Date().toISOString(),
    };

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

export const accountBalanceToolDefinition = {
  name: 'accountBalance',
  description: 'Check the current Runware account credit balance.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
} as const;
