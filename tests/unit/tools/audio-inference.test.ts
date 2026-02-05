/**
 * Unit tests for the audio inference tool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks (must be before imports of mocked modules)
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

import { audioInference, audioInferenceToolDefinition } from '../../../src/tools/audio-inference/handler.js';
import { audioInferenceInputSchema } from '../../../src/tools/audio-inference/schema.js';
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

describe('audioInference', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(audioInferenceToolDefinition.name).toBe('audioInference');
    });

    it('should have required properties in input schema', () => {
      expect(audioInferenceToolDefinition.inputSchema.required).toContain('positivePrompt');
      expect(audioInferenceToolDefinition.inputSchema.required).toContain('model');
    });

    it('should have a description', () => {
      expect(audioInferenceToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept valid input', () => {
      const result = audioInferenceInputSchema.safeParse({
        positivePrompt: 'upbeat jazz',
        model: 'elevenlabs:1@1',
        duration: 30,
        audioType: 'music',
      });
      expect(result.success).toBe(true);
    });

    it('should apply defaults for optional fields', () => {
      const result = audioInferenceInputSchema.safeParse({
        positivePrompt: 'upbeat jazz',
        model: 'elevenlabs:1@1',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.duration).toBe(30);
        expect(result.data.numberResults).toBe(1);
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should reject empty positivePrompt', () => {
      const result = audioInferenceInputSchema.safeParse({
        positivePrompt: '',
        model: 'elevenlabs:1@1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid audioType', () => {
      const result = audioInferenceInputSchema.safeParse({
        positivePrompt: 'upbeat jazz',
        model: 'elevenlabs:1@1',
        audioType: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid outputFormat', () => {
      const result = audioInferenceInputSchema.safeParse({
        positivePrompt: 'upbeat jazz',
        model: 'elevenlabs:1@1',
        outputFormat: 'FLAC',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handler success case', () => {
    it('should return success with valid audio result', async () => {
      const mockResponse = {
        taskType: 'audioInference',
        taskUUID: 'task-uuid',
        status: 'processing',
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const mockPollForResult = pollForResult as ReturnType<typeof vi.fn>;
      mockPollForResult.mockResolvedValue({
        result: {
          taskType: 'audioInference',
          taskUUID: 'task-uuid',
          status: 'success',
          audioUUID: 'audio-uuid-123',
          audioURL: 'https://example.com/audio.mp3',
          cost: 0.30,
        },
        attempts: 3,
        elapsedMs: 5000,
      });

      const input = audioInferenceInputSchema.parse({
        positivePrompt: 'upbeat jazz',
        model: 'elevenlabs:1@1',
        duration: 30,
        audioType: 'music',
      });

      const result = await audioInference(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.cost).toBe(0.30);

      const data = result.data as { results: { audioUUID: string; audioURL: string }[]; cost: number };
      expect(data.results).toHaveLength(1);
      expect(data.results[0]?.audioUUID).toBe('audio-uuid-123');
      expect(data.results[0]?.audioURL).toBe('https://example.com/audio.mp3');
    });
  });

  describe('handler error case', () => {
    it('should return error for invalid model', async () => {
      const input = audioInferenceInputSchema.parse({
        positivePrompt: 'upbeat jazz',
        model: 'elevenlabs:1@1',
        duration: 30,
      });

      // Override model to invalid value after parsing
      const badInput = { ...input, model: 'invalid-model' };

      const result = await audioInference(badInput, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Invalid audio model');
    });

    it('should return error when client throws', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error'),
      );

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

  describe('cost tracking', () => {
    it('should propagate cost from polling result', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'audioInference',
        taskUUID: 'task-uuid',
      });

      const mockPollForResult = pollForResult as ReturnType<typeof vi.fn>;
      mockPollForResult.mockResolvedValue({
        result: {
          taskType: 'audioInference',
          taskUUID: 'task-uuid',
          status: 'success',
          audioUUID: 'audio-uuid',
          cost: 0.15,
        },
        attempts: 2,
        elapsedMs: 3000,
      });

      const input = audioInferenceInputSchema.parse({
        positivePrompt: 'ambient forest',
        model: 'elevenlabs:1@1',
      });

      const result = await audioInference(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.15);
    });
  });
});
