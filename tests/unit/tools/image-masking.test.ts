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
  imageMasking,
  imageMaskingToolDefinition,
  imageMaskingInputSchema,
} from '../../../src/tools/image-masking/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('imageMasking', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('handler', () => {
    it('should return success with detections', async () => {
      const mockResponse = {
        taskType: 'imageMasking',
        taskUUID: 'test-task-uuid',
        inputImageUUID: 'input-img-uuid',
        imageUUID: 'mask-image-uuid',
        maskImageURL: 'https://example.com/mask.png',
        detections: [
          { x_min: 10, y_min: 20, x_max: 100, y_max: 150 },
          { x_min: 200, y_min: 50, x_max: 300, y_max: 200 },
        ],
        cost: 0.002,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageMasking(
        { inputImage: 'https://example.com/face.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('Detected 2 elements');

      const data = result.data as {
        maskImageUUID: string;
        maskImageURL: string;
        detections: { x_min: number; y_min: number; x_max: number; y_max: number }[];
      };
      expect(data.maskImageUUID).toBe('mask-image-uuid');
      expect(data.detections).toHaveLength(2);
    });

    it('should handle single detection', async () => {
      const mockResponse = {
        taskType: 'imageMasking',
        taskUUID: 'uuid',
        imageUUID: 'mask-uuid',
        maskImageURL: 'https://example.com/mask.png',
        detections: [{ x_min: 10, y_min: 20, x_max: 100, y_max: 150 }],
        cost: 0.002,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageMasking(
        { inputImage: 'https://example.com/face.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('Detected 1 element');
    });

    it('should handle response without detections', async () => {
      const mockResponse = {
        taskType: 'imageMasking',
        taskUUID: 'uuid',
        imageUUID: 'mask-uuid',
        maskImageURL: 'https://example.com/mask.png',
        cost: 0.002,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageMasking(
        { inputImage: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      const data = result.data as { detections: unknown[] };
      expect(data.detections).toHaveLength(0);
    });

    it('should return error when API fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Masking failed'),
      );

      const result = await imageMasking(
        { inputImage: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Masking failed');
    });

    it('should propagate cost from response', async () => {
      const mockResponse = {
        taskType: 'imageMasking',
        taskUUID: 'uuid',
        imageUUID: 'mask-uuid',
        maskImageURL: 'https://example.com/mask.png',
        detections: [],
        cost: 0.003,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageMasking(
        { inputImage: 'https://example.com/face.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.003);
    });
  });

  describe('schema', () => {
    it('should validate correct input with required fields', () => {
      const result = imageMaskingInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = imageMaskingInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('runware:35@1');
        expect(result.data.confidence).toBe(0.25);
        expect(result.data.maxDetections).toBe(6);
        expect(result.data.maskPadding).toBe(4);
        expect(result.data.maskBlur).toBe(4);
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should reject missing inputImage', () => {
      const result = imageMaskingInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept custom confidence and maxDetections', () => {
      const result = imageMaskingInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        confidence: 0.5,
        maxDetections: 10,
      });
      expect(result.success).toBe(true);
    });

    it('should reject confidence outside range', () => {
      const result = imageMaskingInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        confidence: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject maxDetections above 20', () => {
      const result = imageMaskingInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        maxDetections: 25,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(imageMaskingToolDefinition.name).toBe('imageMasking');
    });

    it('should require inputImage', () => {
      expect(imageMaskingToolDefinition.inputSchema.required).toContain('inputImage');
    });

    it('should have a description', () => {
      expect(imageMaskingToolDefinition.description).toBeTruthy();
    });
  });
});
