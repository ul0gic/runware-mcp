// Does:  Proves audioInference refuses unknown audio models before any request and reports client failures as errors.
// Holds: config, rate limiter, polling and RunwareClient are mocked; the handler and model validation run for real.

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

vi.mock('../../../src/integrations/runware/polling.js', () => ({
  pollForResult: vi.fn(),
}));

import { audioInference } from '../../../src/tools/audio-inference/handler.js';
import { audioInferenceInputSchema } from '../../../src/tools/audio-inference/schema.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('audioInference', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  it('should return error for invalid model', async () => {
    const input = audioInferenceInputSchema.parse({
      positivePrompt: 'upbeat jazz',
      model: 'elevenlabs:1@1',
      duration: 30,
    });

    const badInput = { ...input, model: 'invalid-model' };

    const result = await audioInference(badInput, mockClient);

    expect(result.status).toBe('error');
    expect(result.message).toContain('Invalid audio model');
    expect(mockClient.request).not.toHaveBeenCalled();
  });

  it('should return error when client throws', async () => {
    (mockClient.request as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const input = audioInferenceInputSchema.parse({
      positivePrompt: 'upbeat jazz',
      model: 'elevenlabs:1@1',
      duration: 30,
    });

    const result = await audioInference(input, mockClient);

    expect(result.status).toBe('error');
    expect(result.message).toContain('Network error');
  });
});
