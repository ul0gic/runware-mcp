/**
 * Unit tests for the transcription tool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

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
    it('should return success with transcribed text after polling', async () => {
      // Initial submission returns acknowledgment (no text)
      const submissionResponse = {
        taskType: 'caption',
        taskUUID: 'task-uuid',
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(submissionResponse);

      // Polling returns the actual result with text
      const pollResponse = {
        result: {
          taskType: 'caption',
          taskUUID: 'task-uuid',
          status: 'success',
          text: 'This is the transcribed text from the video.',
          cost: 0.01,
        },
        attempts: 3,
        elapsedMs: 6500,
      };

      (pollForResult as ReturnType<typeof vi.fn>).mockResolvedValue(pollResponse);

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/video.mp4',
        model: 'memories:1@1',
      });

      const result = await transcription(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.cost).toBe(0.01);

      const data = result.data as { text: string; pollingAttempts: number; elapsedMs: number };
      expect(data.text).toBe('This is the transcribed text from the video.');
      expect(data.pollingAttempts).toBe(3);
      expect(data.elapsedMs).toBe(6500);
    });

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

      // Verify the request was sent with inputs: { video: ... } format
      const requestCall = (mockClient.requestSingle as ReturnType<typeof vi.fn>).mock.calls[0];
      const taskPayload = requestCall[0] as Record<string, unknown>;
      expect(taskPayload.inputs).toEqual({ video: 'https://example.com/video.mp4' });
      expect(taskPayload).not.toHaveProperty('inputImage');
    });

    it('should handle response without text (defaults to empty string)', async () => {
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

      expect(result.status).toBe('success');
      const data = result.data as { text: string };
      expect(data.text).toBe('');
    });

    it('should handle structured data in response', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'caption',
        taskUUID: 'task-uuid',
      });

      (pollForResult as ReturnType<typeof vi.fn>).mockResolvedValue({
        result: {
          taskType: 'caption',
          taskUUID: 'task-uuid',
          status: 'success',
          text: 'Transcript with metadata',
          structuredData: { duration: 120, wordCount: 50 },
          cost: 0.002,
        },
        attempts: 1,
        elapsedMs: 2000,
      });

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/video.mp4',
      });

      const result = await transcription(input, mockClient);

      expect(result.status).toBe('success');
      const data = result.data as { structuredData: { duration: number; wordCount: number } };
      expect(data.structuredData).toBeDefined();
      expect(data.structuredData.duration).toBe(120);
    });
  });

  describe('handler error case', () => {
    it('should return error when client throws on submission', async () => {
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

    it('should return error when polling fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'caption',
        taskUUID: 'task-uuid',
      });

      (pollForResult as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Polling timed out after 150 attempts'),
      );

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/video.mp4',
      });

      const result = await transcription(input, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Polling timed out');
    });
  });

  describe('cost tracking', () => {
    it('should propagate cost from polling response', async () => {
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
          cost: 0.05,
        },
        attempts: 2,
        elapsedMs: 4000,
      });

      const input = transcriptionInputSchema.parse({
        inputMedia: 'https://example.com/video.mp4',
      });

      const result = await transcription(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.05);
    });
  });
});
