/**
 * Unit tests for the account balance tool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../../../src/database/operations.js', () => ({
  recordAnalytics: vi.fn(),
  saveGeneration: vi.fn(),
}));

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
    ENABLE_DATABASE: false,
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    DATABASE_PATH: ':memory:',
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  API_BASE_URL: 'https://api.runware.ai/v1',
}));

// ============================================================================
// Imports
// ============================================================================

import { accountBalance, accountBalanceToolDefinition } from '../../../src/tools/account-balance/handler.js';
import { accountBalanceInputSchema } from '../../../src/tools/account-balance/schema.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

// ============================================================================
// Helpers
// ============================================================================

function createMockClient() {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

// ============================================================================
// Tests
// ============================================================================

describe('accountBalance', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(accountBalanceToolDefinition.name).toBe('accountBalance');
    });

    it('should have empty required array', () => {
      expect(accountBalanceToolDefinition.inputSchema.required).toEqual([]);
    });

    it('should have a description', () => {
      expect(accountBalanceToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept empty object', () => {
      const result = accountBalanceInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept object with no properties', () => {
      const result = accountBalanceInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('handler success case', () => {
    it('should return success with balance', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'accountBalance',
        taskUUID: 'task-uuid',
        balance: 42.50,
        currency: 'USD',
      });

      const input = accountBalanceInputSchema.parse({});
      const result = await accountBalance(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('42.50');
      expect(result.message).toContain('USD');

      const data = result.data as { balance: number; currency: string; retrievedAt: string };
      expect(data.balance).toBe(42.50);
      expect(data.currency).toBe('USD');
      expect(data.retrievedAt).toBeDefined();
    });

    it('should default to 0 balance when not provided', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'accountBalance',
        taskUUID: 'task-uuid',
      });

      const input = accountBalanceInputSchema.parse({});
      const result = await accountBalance(input, mockClient);

      expect(result.status).toBe('success');
      const data = result.data as { balance: number; currency: string };
      expect(data.balance).toBe(0);
      expect(data.currency).toBe('USD');
    });
  });

  describe('handler error case', () => {
    it('should return error when client throws', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Authentication failed'),
      );

      const input = accountBalanceInputSchema.parse({});
      const result = await accountBalance(input, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Authentication failed');
    });
  });
});
