/**
 * Unit tests for the vectorize tool.
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

// ============================================================================
// Imports
// ============================================================================

import { vectorize, vectorizeToolDefinition } from '../../../src/tools/vectorize/handler.js';
import { vectorizeInputSchema } from '../../../src/tools/vectorize/schema.js';
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

describe('vectorize', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(vectorizeToolDefinition.name).toBe('vectorize');
    });

    it('should require inputImage', () => {
      expect(vectorizeToolDefinition.inputSchema.required).toContain('inputImage');
    });

    it('should have a description', () => {
      expect(vectorizeToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept valid input with URL', () => {
      const result = vectorizeInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const result = vectorizeInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('recraft:1@1');
        expect(result.data.outputFormat).toBe('SVG');
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should accept picsart model', () => {
      const result = vectorizeInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        model: 'picsart:1@1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid model', () => {
      const result = vectorizeInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        model: 'invalid-model',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handler success case', () => {
    it('should return success with vectorized SVG', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'vectorize',
        taskUUID: 'task-uuid',
        imageUUID: 'image-uuid-123',
        imageURL: 'https://example.com/vectorized.svg',
        cost: 0.005,
      });

      const input = vectorizeInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        model: 'recraft:1@1',
        outputFormat: 'SVG',
      });

      const result = await vectorize(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('vectorized');
      expect(result.cost).toBe(0.005);

      const data = result.data as { imageUUID: string; imageURL: string };
      expect(data.imageUUID).toBe('image-uuid-123');
      expect(data.imageURL).toBe('https://example.com/vectorized.svg');
    });
  });

  describe('handler error case', () => {
    it('should return error for invalid model at runtime', async () => {
      const input = vectorizeInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
      });

      // Override model to invalid value after parsing
      const badInput = { ...input, model: 'invalid:1@1' as 'recraft:1@1' };

      const result = await vectorize(badInput, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Invalid vectorize model');
    });

    it('should return error when client throws', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Connection refused'),
      );

      const input = vectorizeInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
      });

      const result = await vectorize(input, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Connection refused');
    });
  });

  describe('cost tracking', () => {
    it('should propagate cost from API response', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'vectorize',
        taskUUID: 'task-uuid',
        imageUUID: 'img-uuid',
        cost: 0.01,
      });

      const input = vectorizeInputSchema.parse({
        inputImage: 'https://example.com/image.png',
      });

      const result = await vectorize(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.01);
    });
  });
});
