// Does:  Proves imageCaption reports a missing caption and client failures as errors.
// Holds: config, rate limiter and RunwareClient are mocked; the handler runs for real.

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

import { imageCaption, imageCaptionInputSchema } from '../../../src/tools/image-caption/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('imageCaption', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  it('should return an error when the response has no text', async () => {
    (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskType: 'caption',
      taskUUID: 'uuid',
      cost: 0.001,
    });

    const result = await imageCaption(
      imageCaptionInputSchema.parse({ inputImage: 'https://example.com/image.jpg' }),
      mockClient,
    );

    expect(result).toMatchObject({ status: 'error', message: 'Caption response did not include text' });
  });

  it('should return error when API fails', async () => {
    (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Caption service unavailable'));

    const result = await imageCaption(
      imageCaptionInputSchema.parse({ inputImage: 'https://example.com/image.jpg' }),
      mockClient,
    );

    expect(result.status).toBe('error');
    expect(result.message).toContain('Caption service unavailable');
  });
});
