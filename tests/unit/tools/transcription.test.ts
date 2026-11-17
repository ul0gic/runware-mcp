// Does:  Proves transcription sends media as inputs.video and reports missing text and polling failures as errors.
// Holds: config, the rate limiter and pollForResult are mocked; the client is a stub that only acknowledges.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/shared/rate-limiter.js', () => ({
  defaultRateLimiter: {
    waitForToken: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/integrations/runware/polling.js', () => ({
  pollForResult: vi.fn(),
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

import { transcription } from '../../../src/tools/transcription/handler.js';
import { transcriptionInputSchema } from '../../../src/tools/transcription/schema.js';
import { pollForResult } from '../../../src/integrations/runware/polling.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient() {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('transcription', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('schema validation', () => {
    it('should reject invalid language code length', () => {
      const result = transcriptionInputSchema.safeParse({
        inputMedia: 'https://example.com/video.mp4',
        language: 'eng',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handler success case', () => {
    it('should send correct API format with inputs.video', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'caption',
        taskUUID: 'task-uuid',
      });

      (pollForResult as ReturnType<typeof vi.fn>).mockResolvedValue({
        result: {
          taskType: 'caption',
          taskUUID: 'task-uuid',
          status: 'success',
          text: 'Hello world',
          cost: 0.001,
        },
        attempts: 1,
        elapsedMs: 2000,
      });

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/video.mp4',
      });

      await transcription(input, mockClient);

      const requestCall = (mockClient.requestSingle as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(requestCall).toBeDefined();
      if (requestCall === undefined) {
        throw new Error('requestSingle was never called');
      }
      const taskPayload = requestCall[0] as Record<string, unknown>;
      expect(taskPayload.inputs).toEqual({ video: 'https://example.com/video.mp4' });
      expect(taskPayload).not.toHaveProperty('inputImage');
    });

    it('should return an error when the polled result has no text', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'caption',
        taskUUID: 'task-uuid',
      });

      (pollForResult as ReturnType<typeof vi.fn>).mockResolvedValue({
        result: {
          taskType: 'caption',
          taskUUID: 'task-uuid',
          status: 'success',
          cost: 0.001,
        },
        attempts: 2,
        elapsedMs: 4000,
      });

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/video.mp4',
      });

      const result = await transcription(input, mockClient);

      expect(result).toMatchObject({ status: 'error', message: 'Transcription result did not include text' });
    });
  });

  describe('handler error case', () => {
    it('should return error when polling fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'caption',
        taskUUID: 'task-uuid',
      });

      (pollForResult as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Polling timed out after 150 attempts'));

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/video.mp4',
      });

      const result = await transcription(input, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Polling timed out');
    });
  });
});
