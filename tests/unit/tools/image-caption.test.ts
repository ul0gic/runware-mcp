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
  imageCaption,
  imageCaptionToolDefinition,
  imageCaptionInputSchema,
} from '../../../src/tools/image-caption/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('imageCaption', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('handler', () => {
    it('should return success with caption text', async () => {
      const mockResponse = {
        taskType: 'caption',
        taskUUID: 'test-task-uuid',
        text: 'A fluffy orange cat sitting on a blue couch in a living room',
        cost: 0.001,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageCaption(
        { inputImage: 'https://example.com/cat.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('captioned');

      const data = result.data as { text: string; cost: number };
      expect(data.text).toBe('A fluffy orange cat sitting on a blue couch in a living room');
    });

    it('should handle response without text (defaults to empty string)', async () => {
      const mockResponse = {
        taskType: 'caption',
        taskUUID: 'uuid',
        cost: 0.001,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageCaption(
        { inputImage: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      const data = result.data as { text: string };
      expect(data.text).toBe('');
    });

    it('should handle structured data in response', async () => {
      const mockResponse = {
        taskType: 'caption',
        taskUUID: 'uuid',
        text: 'Person, age 25-30',
        structuredData: { age: 27, gender: 'female' },
        cost: 0.002,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageCaption(
        { inputImage: 'https://example.com/person.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      const data = result.data as { structuredData: { age: number; gender: string } };
      expect(data.structuredData).toBeDefined();
      expect(data.structuredData.age).toBe(27);
    });

    it('should return error when API fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Caption service unavailable'),
      );

      const result = await imageCaption(
        { inputImage: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Caption service unavailable');
    });

    it('should propagate cost from response', async () => {
      const mockResponse = {
        taskType: 'caption',
        taskUUID: 'uuid',
        text: 'A beautiful sunset over the ocean',
        cost: 0.0015,
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageCaption(
        { inputImage: 'https://example.com/sunset.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.0015);
    });
  });

  describe('schema', () => {
    it('should validate correct input with required fields', () => {
      const result = imageCaptionInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = imageCaptionInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('runware:152@2');
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should reject missing inputImage', () => {
      const result = imageCaptionInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept optional prompt', () => {
      const result = imageCaptionInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        prompt: 'Describe the main subject in detail',
      });
      expect(result.success).toBe(true);
    });

    it('should accept custom model', () => {
      const result = imageCaptionInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        model: 'runware:151@1',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(imageCaptionToolDefinition.name).toBe('imageCaption');
    });

    it('should require inputImage', () => {
      expect(imageCaptionToolDefinition.inputSchema.required).toContain('inputImage');
    });

    it('should have a description', () => {
      expect(imageCaptionToolDefinition.description).toBeTruthy();
    });
  });
});
