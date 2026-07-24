import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import { ACCOUNT_OPERATIONS, type AccountManagementInput } from './schema.js';

const SENSITIVE_FIELD_PATTERN = /(?:secret|token|credential|api.?key(?:value)?$|keyValue)/iu;

function redactSensitiveFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveFields(item));
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      SENSITIVE_FIELD_PATTERN.test(key) && !key.toLowerCase().endsWith('uuid')
        ? '[REDACTED]'
        : redactSensitiveFields(child),
    ]),
  );
}

export async function accountManagement(
  input: AccountManagementInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);
    const task = createTaskRequest('accountManagement', {
      operation: input.operation,
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.models !== undefined && { models: input.models }),
      ...(input.apiKeys !== undefined && { apiKeys: input.apiKeys }),
      ...(input.groupBy !== undefined && { groupBy: input.groupBy }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
    });
    const response = await runwareClient.requestSingle<Record<string, unknown>>(
      task,
      { signal: context?.signal },
    );
    return successResult(
      `Account operation ${input.operation} completed`,
      redactSensitiveFields(response),
    );
  } catch (error) {
    const wrapped = wrapError(error);
    return errorResult(wrapped.message, wrapped.data);
  }
}

export const accountManagementToolDefinition = {
  name: 'accountManagement',
  description:
    'Read organization details or usage activity, performance, and errors. Secret-like response fields are redacted.',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: {
      operation: { type: 'string', enum: ACCOUNT_OPERATIONS },
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' },
      models: { type: 'array', maxItems: 100, items: { type: 'string' } },
      apiKeys: { type: 'array', maxItems: 100, items: { type: 'string' } },
      groupBy: {
        type: 'array',
        items: { type: 'string', enum: ['date', 'model', 'apiKey'] },
      },
      timezone: { type: 'string' },
    },
    required: ['operation'],
  },
} as const;
