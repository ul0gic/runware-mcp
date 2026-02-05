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
}));

import {
  imageBackgroundRemoval,
  imageBackgroundRemovalToolDefinition,
  imageBackgroundRemovalInputSchema,
} from '../../../src/tools/image-background-removal/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('imageBackgroundRemoval', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('handler', () => {
    it('should return success with valid input', async () => {
      const mockResponse = {
        taskType: 'removeBackground',
        taskUUID: 'test-task-uuid',
        imageUUID: 'result-image-uuid',
        imageURL: 'https://example.com/nobg.png',
        cost: 0.003,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageBackgroundRemoval(
        { inputImage: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('Background removed');

      const data = result.data as { imageUUID: string; imageURL: string };
      expect(data.imageUUID).toBe('result-image-uuid');
      expect(data.imageURL).toBe('https://example.com/nobg.png');
    });

    it('should return error when API fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Background removal failed'),
      );

      const result = await imageBackgroundRemoval(
        { inputImage: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Background removal failed');
    });

    it('should propagate cost from response', async () => {
      const mockResponse = {
        taskType: 'removeBackground',
        taskUUID: 'uuid',
        imageUUID: 'img-uuid',
        imageURL: 'https://example.com/nobg.png',
        cost: 0.004,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageBackgroundRemoval(
        { inputImage: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.004);
    });

    it('should handle response without cost', async () => {
      const mockResponse = {
        taskType: 'removeBackground',
        taskUUID: 'uuid',
        imageUUID: 'img-uuid',
        imageURL: 'https://example.com/nobg.png',
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageBackgroundRemoval(
        { inputImage: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.cost).toBeUndefined();
    });
  });

  describe('schema', () => {
    it('should validate correct input with required fields', () => {
      const result = imageBackgroundRemovalInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = imageBackgroundRemovalInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('runware:109@1');
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should reject missing inputImage', () => {
      const result = imageBackgroundRemovalInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept optional settings', () => {
      const result = imageBackgroundRemovalInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        model: 'runware:109@1',
        settings: {
          alphaMatting: true,
          alphaMattingForegroundThreshold: 240,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(imageBackgroundRemovalToolDefinition.name).toBe('imageBackgroundRemoval');
    });

    it('should require inputImage', () => {
      expect(imageBackgroundRemovalToolDefinition.inputSchema.required).toContain('inputImage');
    });

    it('should have a description', () => {
      expect(imageBackgroundRemovalToolDefinition.description).toBeTruthy();
    });
  });
});
