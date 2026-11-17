// Does:  Proves controlNetPreprocess rejects out-of-range canny thresholds and reports client failures as errors.
// Holds: config, rate limiter and RunwareClient are mocked; the schema and handler run for real.

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

import { controlNetPreprocess } from '../../../src/tools/controlnet-preprocess/handler.js';
import { controlNetPreprocessInputSchema } from '../../../src/tools/controlnet-preprocess/schema.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('controlNetPreprocess', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  it('should reject out-of-range canny thresholds', () => {
    const result = controlNetPreprocessInputSchema.safeParse({
      inputImage: 'https://example.com/image.jpg',
      preprocessor: 'canny',
      lowThresholdCanny: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should return error when client throws', async () => {
    (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Server error'));

    const input = controlNetPreprocessInputSchema.parse({
      inputImage: 'https://example.com/image.jpg',
      preprocessor: 'canny',
    });

    const result = await controlNetPreprocess(input, mockClient);

    expect(result.status).toBe('error');
    expect(result.message).toContain('Server error');
  });
});
