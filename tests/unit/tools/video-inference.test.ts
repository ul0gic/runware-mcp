import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/database/operations.js', () => ({
  recordAnalytics: vi.fn(),
  saveGeneration: vi.fn(),
}));

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
    ENABLE_DATABASE: false,
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    DATABASE_PATH: ':memory:',
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

import {
  videoInference,
  videoInferenceToolDefinition,
  videoInferenceInputSchema,
} from '../../../src/tools/video-inference/index.js';
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
    it('should return success after polling completes', async () => {
      // Mock the initial submission
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'videoInference',
        taskUUID: 'test-task-uuid',
        status: 'processing',
      });

      // Mock polling to return completed result
      (pollForResult as ReturnType<typeof vi.fn>).mockResolvedValue({
        result: {
          taskType: 'videoInference',
          taskUUID: 'test-task-uuid',
          status: 'success',
          videoUUID: 'video-uuid',
          videoURL: 'https://example.com/video.mp4',
          seed: 42,
          cost: 0.15,
        },
        attempts: 5,
        elapsedMs: 12000,
      });

      const result = await videoInference(
        {
          positivePrompt: 'a cat walking through a garden',
          model: 'klingai:1@1',
          duration: 5,
        },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('Video generated');

      const data = result.data as {
        videoUUID: string;
        videoURL: string;
        pollingAttempts: number;
        elapsedMs: number;
      };
      expect(data.videoUUID).toBe('video-uuid');
      expect(data.videoURL).toBe('https://example.com/video.mp4');
      expect(data.pollingAttempts).toBe(5);
      expect(data.elapsedMs).toBe(12000);
    });

    it('should return error when submission fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Submission failed'),
      );

      const result = await videoInference(
        {
          positivePrompt: 'a video',
          model: 'klingai:1@1',
          duration: 5,
        },
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Submission failed');
    });

    it('should return error when polling fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'videoInference',
        taskUUID: 'uuid',
        status: 'processing',
      });

      (pollForResult as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Polling timed out'),
      );

      const result = await videoInference(
        {
          positivePrompt: 'a video',
          model: 'klingai:1@1',
          duration: 5,
        },
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Polling timed out');
    });

    it('should propagate cost from response', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'videoInference',
        taskUUID: 'uuid',
        status: 'processing',
      });

      (pollForResult as ReturnType<typeof vi.fn>).mockResolvedValue({
        result: {
          taskType: 'videoInference',
          taskUUID: 'uuid',
          status: 'success',
          videoUUID: 'video-uuid',
          videoURL: 'https://example.com/video.mp4',
          cost: 0.25,
        },
        attempts: 3,
        elapsedMs: 8000,
      });

      const result = await videoInference(
        {
          positivePrompt: 'a cat',
          model: 'klingai:1@1',
          duration: 5,
        },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.25);
    });
  });

  describe('schema', () => {
    it('should validate correct input with required fields', () => {
      const result = videoInferenceInputSchema.safeParse({
        positivePrompt: 'a cat walking through a garden',
        model: 'klingai:1@1',
        duration: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = videoInferenceInputSchema.safeParse({
        positivePrompt: 'a cat walking',
        model: 'klingai:1@1',
        duration: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should reject missing positivePrompt', () => {
      const result = videoInferenceInputSchema.safeParse({
        model: 'klingai:1@1',
        duration: 5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing model', () => {
      const result = videoInferenceInputSchema.safeParse({
        positivePrompt: 'a cat walking',
        duration: 5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing duration', () => {
      const result = videoInferenceInputSchema.safeParse({
        positivePrompt: 'a cat walking',
        model: 'klingai:1@1',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional parameters', () => {
      const result = videoInferenceInputSchema.safeParse({
        positivePrompt: 'a scenic landscape',
        model: 'klingai:1.5@2',
        duration: 10,
        width: 1280,
        height: 720,
        fps: 30,
        seed: 42,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(videoInferenceToolDefinition.name).toBe('videoInference');
    });

    it('should require positivePrompt, model, and duration', () => {
      expect(videoInferenceToolDefinition.inputSchema.required).toContain('positivePrompt');
      expect(videoInferenceToolDefinition.inputSchema.required).toContain('model');
      expect(videoInferenceToolDefinition.inputSchema.required).toContain('duration');
    });

    it('should have a description', () => {
      expect(videoInferenceToolDefinition.description).toBeTruthy();
    });
  });
});
