/**
 * Unit tests for the ControlNet preprocess tool.
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

import { controlNetPreprocess, controlNetPreprocessToolDefinition } from '../../../src/tools/controlnet-preprocess/handler.js';
import { controlNetPreprocessInputSchema } from '../../../src/tools/controlnet-preprocess/schema.js';
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

describe('controlNetPreprocess', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(controlNetPreprocessToolDefinition.name).toBe('controlNetPreprocess');
    });

    it('should require inputImage and preprocessor', () => {
      expect(controlNetPreprocessToolDefinition.inputSchema.required).toContain('inputImage');
      expect(controlNetPreprocessToolDefinition.inputSchema.required).toContain('preprocessor');
    });

    it('should have a description', () => {
      expect(controlNetPreprocessToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept valid input with canny preprocessor', () => {
      const result = controlNetPreprocessInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        preprocessor: 'canny',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid preprocessors', () => {
      const preprocessors = [
        'canny', 'depth', 'mlsd', 'normalbae', 'openpose', 'tile',
        'seg', 'lineart', 'lineart_anime', 'shuffle', 'scribble', 'softedge',
      ];

      for (const preprocessor of preprocessors) {
        const result = controlNetPreprocessInputSchema.safeParse({
          inputImage: 'https://example.com/image.jpg',
          preprocessor,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid preprocessor', () => {
      const result = controlNetPreprocessInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        preprocessor: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional canny thresholds', () => {
      const result = controlNetPreprocessInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        preprocessor: 'canny',
        lowThresholdCanny: 50,
        highThresholdCanny: 200,
      });
      expect(result.success).toBe(true);
    });

    it('should reject out-of-range canny thresholds', () => {
      const result = controlNetPreprocessInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        preprocessor: 'canny',
        lowThresholdCanny: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handler success case', () => {
    it('should return success with guide image', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'controlNetPreprocess',
        taskUUID: 'task-uuid',
        guideImageUUID: 'guide-uuid-123',
        guideImageURL: 'https://example.com/guide.jpg',
        inputImageUUID: 'input-uuid-123',
        cost: 0.001,
      });

      const input = controlNetPreprocessInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        preprocessor: 'canny',
      });

      const result = await controlNetPreprocess(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('Canny Edge');
      expect(result.cost).toBe(0.001);

      const data = result.data as { guideImageUUID: string; guideImageURL: string };
      expect(data.guideImageUUID).toBe('guide-uuid-123');
      expect(data.guideImageURL).toBe('https://example.com/guide.jpg');
    });

    it('should handle depth preprocessor', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'controlNetPreprocess',
        taskUUID: 'task-uuid',
        guideImageUUID: 'depth-guide-uuid',
        guideImageURL: 'https://example.com/depth.jpg',
        cost: 0.001,
      });

      const input = controlNetPreprocessInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        preprocessor: 'depth',
      });

      const result = await controlNetPreprocess(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('Depth Map');
    });
  });

  describe('handler error case', () => {
    it('should return error when client throws', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Server error'),
      );

      const input = controlNetPreprocessInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        preprocessor: 'canny',
      });

      const result = await controlNetPreprocess(input, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Server error');
    });
  });

  describe('cost tracking', () => {
    it('should propagate cost from API response', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'controlNetPreprocess',
        taskUUID: 'task-uuid',
        guideImageUUID: 'guide-uuid',
        cost: 0.003,
      });

      const input = controlNetPreprocessInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        preprocessor: 'openpose',
      });

      const result = await controlNetPreprocess(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.003);
    });
  });
});
