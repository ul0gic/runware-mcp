// Does:  Proves modelSearch falls back to a zero total on an empty response and bounds its pagination inputs.
// Holds: config and the rate limiter are mocked; the client is a stub returning an empty data array.

import { describe, expect, it, vi } from 'vitest';

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

import type { RunwareClient } from '../../../src/integrations/runware/client.js';
import { modelSearch, modelSearchInputSchema } from '../../../src/tools/model-search/index.js';

describe('modelSearch', () => {
  it('should return success with empty results', async () => {
    const client = {
      request: vi.fn().mockResolvedValue({ data: [] }),
      requestSingle: vi.fn(),
      generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
    } as unknown as RunwareClient;

    const result = await modelSearch(modelSearchInputSchema.parse({ search: 'nonexistent-model-xyz' }), client);

    expect(result.status).toBe('success');
    expect(result.message).toContain('No models found');

    const data = result.data as { models: unknown[]; totalResults: number };
    expect(data.models).toHaveLength(0);
    expect(data.totalResults).toBe(0);
  });

  it('should reject limit above 100', () => {
    const result = modelSearchInputSchema.safeParse({
      limit: 101,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative offset', () => {
    const result = modelSearchInputSchema.safeParse({
      offset: -1,
    });
    expect(result.success).toBe(false);
  });
});
