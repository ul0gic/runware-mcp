// Does:  Proves vectorize refuses a model outside its allow-list even when schema parsing was bypassed.
// Holds: config and the rate limiter are mocked; the stub client is never expected to be reached.

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

import { vectorize } from '../../../src/tools/vectorize/handler.js';
import { vectorizeInputSchema } from '../../../src/tools/vectorize/schema.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient() {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('vectorize', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('handler error case', () => {
    it('should return error for invalid model at runtime', async () => {
      const input = vectorizeInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
      });

      const badInput = { ...input, model: 'invalid:1@1' as 'recraft:1@1' };

      const result = await vectorize(badInput, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Invalid vectorize model');
      expect(mockClient.requestSingle).not.toHaveBeenCalled();
    });
  });
});
