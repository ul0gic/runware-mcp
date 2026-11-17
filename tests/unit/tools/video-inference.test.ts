// Does:  Proves videoInference turns a polling failure after a successful submission into an error result.
// Holds: config, provider detection and pollForResult are mocked; the client stub only acknowledges submission.

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
  DEFAULT_POLL_INTERVAL_MS: 2000,
  MAX_POLL_INTERVAL_MS: 10000,
}));

vi.mock('../../../src/shared/provider-settings.js', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    detectProvider: vi.fn().mockReturnValue('klingai'),
  };
});

vi.mock('../../../src/integrations/runware/polling.js', () => ({
  pollForResult: vi.fn(),
}));

import { videoInference, videoInferenceInputSchema } from '../../../src/tools/video-inference/index.js';
import { pollForResult } from '../../../src/integrations/runware/polling.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('videoInference', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('handler', () => {
    it('should return error when polling fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'videoInference',
        taskUUID: 'uuid',
        status: 'processing',
      });

      (pollForResult as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Polling timed out'));

      const result = await videoInference(
        videoInferenceInputSchema.parse({
          positivePrompt: 'a video',
          model: 'klingai:1@1',
          duration: 5,
        }),
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Polling timed out');
    });
  });
});
