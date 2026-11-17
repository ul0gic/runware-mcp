// Does:  Proves imageInference collects every image in a multi-result response and reports client failures as errors.
// Holds: config, rate limiter, provider detection and RunwareClient are mocked; the handler runs for real.

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

vi.mock('../../../src/shared/provider-settings.js', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    detectProvider: vi.fn().mockReturnValue('civitai'),
  };
});

import { imageInference, imageInferenceInputSchema } from '../../../src/tools/image-inference/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('imageInference', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  it('should return every image from a multi-result response', async () => {
    (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          taskType: 'imageInference',
          taskUUID: 'uuid-1',
          imageUUID: 'img-1',
          imageURL: 'https://example.com/1.png',
          cost: 0.01,
        },
        {
          taskType: 'imageInference',
          taskUUID: 'uuid-2',
          imageUUID: 'img-2',
          imageURL: 'https://example.com/2.png',
          cost: 0.01,
        },
      ],
    });

    const result = await imageInference(
      imageInferenceInputSchema.parse({ positivePrompt: 'a cat', model: 'civitai:123@456', numberResults: 2 }),
      mockClient,
    );

    expect(result.status).toBe('success');
    expect(result.message).toContain('Generated 2 images');

    const data = result.data as { images: unknown[] };
    expect(data.images).toHaveLength(2);
  });

  it('should return error when API fails', async () => {
    (mockClient.request as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));

    const result = await imageInference(
      imageInferenceInputSchema.parse({ positivePrompt: 'a cat', model: 'civitai:123@456' }),
      mockClient,
    );

    expect(result.status).toBe('error');
    expect(result.message).toContain('API error');
  });
});
