// Does:  Proves accountBalance reads both balance shapes and turns a missing amount or a client failure into errors.
// Holds: config, rate limiter and RunwareClient are mocked; the handler and its response parsing run for real.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/shared/rate-limiter.js', () => ({
  defaultRateLimiter: {
    waitForToken: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: [],
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  API_BASE_URL: 'https://api.runware.ai/v1',
}));

import { accountBalance } from '../../../src/tools/account-balance/handler.js';
import { accountBalanceInputSchema } from '../../../src/tools/account-balance/schema.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('accountBalance', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  it('should parse the current nested accountManagement balance response', async () => {
    (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskType: 'accountManagement',
      taskUUID: 'task-uuid',
      balance: {
        amount: 2450.75,
        freeBalance: 120,
        currency: 'USD',
      },
    });

    const input = accountBalanceInputSchema.parse({});
    const result = await accountBalance(input, mockClient);

    expect(result.status).toBe('success');
    expect(result.message).toContain('2450.75');
    expect(result.data).toMatchObject({
      balance: 2450.75,
      currency: 'USD',
    });
  });

  it('should return an error, not USD 0.00, when the response has no balance', async () => {
    (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskType: 'accountBalance',
      taskUUID: 'task-uuid',
    });

    const input = accountBalanceInputSchema.parse({});
    const result = await accountBalance(input, mockClient);

    expect(result).toMatchObject({
      status: 'error',
      message: 'Balance response did not include a balance amount',
      data: { taskUUID: 'task-uuid' },
    });
    expect(result.message).not.toContain('0.00');
  });

  it('should return error when client throws', async () => {
    (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Authentication failed'));

    const input = accountBalanceInputSchema.parse({});
    const result = await accountBalance(input, mockClient);

    expect(result.status).toBe('error');
    expect(result.message).toContain('Authentication failed');
  });
});
