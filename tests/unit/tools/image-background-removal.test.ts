// Does:  Proves imageBackgroundRemoval reports a client failure as an error result instead of throwing.
// Holds: config, rate limiter and RunwareClient are mocked; the handler runs for real.

import { describe, it, expect, vi } from 'vitest';

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

import {
  imageBackgroundRemoval,
  imageBackgroundRemovalInputSchema,
} from '../../../src/tools/image-background-removal/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

describe('imageBackgroundRemoval', () => {
  it('should return error when API fails', async () => {
    const mockClient = {
      request: vi.fn(),
      requestSingle: vi.fn().mockRejectedValue(new Error('Background removal failed')),
      generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
    } as unknown as RunwareClient;

    const result = await imageBackgroundRemoval(
      imageBackgroundRemovalInputSchema.parse({ inputImage: 'https://example.com/image.jpg' }),
      mockClient,
    );

    expect(result.status).toBe('error');
    expect(result.message).toContain('Background removal failed');
  });
});
