/**
 * Unit tests for the transcription tool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

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
}));

vi.mock('../../../src/integrations/runware/polling.js', () => ({
  pollForResult: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import { transcription, transcriptionToolDefinition } from '../../../src/tools/transcription/handler.js';
import { transcriptionInputSchema } from '../../../src/tools/transcription/schema.js';
import { pollForResult } from '../../../src/integrations/runware/polling.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

// ============================================================================
// Helpers
// ============================================================================

function createMockClient() {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

// ============================================================================
// Tests
// ============================================================================

describe('transcription', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(transcriptionToolDefinition.name).toBe('transcription');
    });

    it('should require inputMedia', () => {
      expect(transcriptionToolDefinition.inputSchema.required).toContain('inputMedia');
    });

    it('should have a description', () => {
      expect(transcriptionToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept valid input', () => {
      const result = transcriptionInputSchema.safeParse({
        inputMedia: 'https://example.com/video.mp4',
      });
      expect(result.success).toBe(true);
    });

    it('should apply model default', () => {
      const result = transcriptionInputSchema.safeParse({
        inputMedia: 'https://example.com/video.mp4',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('memories:1@1');
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should accept valid language code', () => {
      const result = transcriptionInputSchema.safeParse({
        inputMedia: 'https://example.com/video.mp4',
        language: 'en',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty inputMedia', () => {
      const result = transcriptionInputSchema.safeParse({
        inputMedia: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid language code length', () => {
      const result = transcriptionInputSchema.safeParse({
        inputMedia: 'https://example.com/video.mp4',
        language: 'eng',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handler success case', () => {
    it('should return success with transcribed text', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'transcription',
        taskUUID: 'task-uuid',
      });

      const mockPollForResult = pollForResult as ReturnType<typeof vi.fn>;
      mockPollForResult.mockResolvedValue({
        result: {
          taskType: 'transcription',
          taskUUID: 'task-uuid',
          status: 'success',
          text: 'This is the transcribed text from the video.',
          detectedLanguage: 'en',
          cost: 0.01,
        },
        attempts: 2,
        elapsedMs: 4000,
      });

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/video.mp4',
        model: 'memories:1@1',
      });

      const result = await transcription(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.cost).toBe(0.01);

      const data = result.data as { text: string; detectedLanguage?: string };
      expect(data.text).toBe('This is the transcribed text from the video.');
      expect(data.detectedLanguage).toBe('en');
    });
  });

  describe('handler error case', () => {
    it('should return error when client throws', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API error'),
      );

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/video.mp4',
      });

      const result = await transcription(input, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('API error');
    });
  });

  describe('cost tracking', () => {
    it('should propagate cost from poll result', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'transcription',
        taskUUID: 'task-uuid',
      });

      const mockPollForResult = pollForResult as ReturnType<typeof vi.fn>;
      mockPollForResult.mockResolvedValue({
        result: {
          taskType: 'transcription',
          taskUUID: 'task-uuid',
          status: 'success',
          text: 'Hello world',
          cost: 0.05,
        },
        attempts: 1,
        elapsedMs: 2000,
      });

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/audio.wav',
      });

      const result = await transcription(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.05);
    });
  });
});
