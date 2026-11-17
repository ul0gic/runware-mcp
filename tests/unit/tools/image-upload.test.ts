// Does:  Proves imageUpload refuses input with no image source and reports client failures as errors.
// Holds: config, rate limiter and RunwareClient are mocked; the schema and handler run for real.

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
  getMaxFileSizeBytes: vi.fn().mockReturnValue(50 * 1024 * 1024),
}));

import { imageUpload, imageUploadInputSchema } from '../../../src/tools/image-upload/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

describe('imageUpload', () => {
  it('should reject input with no image source', () => {
    const result = imageUploadInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should return error when API fails', async () => {
    const mockClient = {
      request: vi.fn(),
      requestSingle: vi.fn().mockRejectedValue(new Error('Upload failed')),
      generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
    } as unknown as RunwareClient;

    const result = await imageUpload({ url: 'https://example.com/image.jpg' }, mockClient);

    expect(result.status).toBe('error');
    expect(result.message).toContain('Upload failed');
  });
});
