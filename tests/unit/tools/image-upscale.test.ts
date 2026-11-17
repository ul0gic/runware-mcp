// Does:  Proves imageUpscale turns an API failure into an error result instead of throwing.
// Holds: config and the rate limiter are mocked; the client is a stub whose requestSingle rejects.

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
import { imageUpscale, imageUpscaleInputSchema } from '../../../src/tools/image-upscale/index.js';

describe('imageUpscale', () => {
  it('should return error when API fails', async () => {
    const client = {
      request: vi.fn(),
      requestSingle: vi.fn().mockRejectedValue(new Error('Upscale failed')),
      generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
    } as unknown as RunwareClient;

    const result = await imageUpscale(
      imageUpscaleInputSchema.parse({ inputImage: 'https://example.com/image.jpg' }),
      client,
    );

    expect(result.status).toBe('error');
    expect(result.message).toContain('Upscale failed');
  });
});
