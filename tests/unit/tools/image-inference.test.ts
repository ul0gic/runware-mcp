import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must come before imports of modules that use them
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

vi.mock('../../../src/shared/provider-settings.js', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    detectProvider: vi.fn().mockReturnValue('civitai'),
  };
});

import {
  imageInference,
  imageInferenceToolDefinition,
  imageInferenceInputSchema,
} from '../../../src/tools/image-inference/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('imageInference', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('handler', () => {
    it('should return success with valid input', async () => {
      const mockResponse = {
        data: [
          {
            taskType: 'imageInference',
            taskUUID: 'test-task-uuid',
            imageUUID: 'test-image-uuid',
            imageURL: 'https://example.com/image.png',
            cost: 0.01,
            seed: 42,
          },
        ],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageInference(
        { positivePrompt: 'a cat sitting on a couch', model: 'civitai:123@456' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('Generated 1 image');
      expect(result.data).toBeDefined();

      const data = result.data as { images: { imageUUID: string; imageURL: string }[]; cost: number };
      expect(data.images).toHaveLength(1);
      expect(data.images[0]?.imageUUID).toBe('test-image-uuid');
      expect(data.images[0]?.imageURL).toBe('https://example.com/image.png');
    });

    it('should return success with multiple images', async () => {
      const mockResponse = {
        data: [
          {
            taskType: 'imageInference',
            taskUUID: 'uuid-1',
            imageUUID: 'img-1',
            imageURL: 'https://example.com/1.png',
            cost: 0.01,
          },
          {
            taskType: 'imageInference',
            taskUUID: 'uuid-2',
            imageUUID: 'img-2',
            imageURL: 'https://example.com/2.png',
            cost: 0.01,
          },
        ],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageInference(
        { positivePrompt: 'a cat', model: 'civitai:123@456', numberResults: 2 },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('Generated 2 images');

      const data = result.data as { images: unknown[] };
      expect(data.images).toHaveLength(2);
    });

    it('should return error when API fails', async () => {
      (mockClient.request as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));

      const result = await imageInference(
        { positivePrompt: 'a cat', model: 'civitai:123@456' },
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('API error');
    });

    it('should propagate cost from response', async () => {
      const mockResponse = {
        data: [
          {
            taskType: 'imageInference',
            taskUUID: 'uuid',
            imageUUID: 'img-uuid',
            imageURL: 'https://example.com/img.png',
            cost: 0.05,
          },
        ],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageInference(
        { positivePrompt: 'a dog', model: 'civitai:123@456' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.05);
    });
  });

  describe('schema', () => {
    it('should validate correct input with required fields', () => {
      const result = imageInferenceInputSchema.safeParse({
        positivePrompt: 'a beautiful landscape painting',
        model: 'civitai:123@456',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = imageInferenceInputSchema.safeParse({
        positivePrompt: 'a beautiful landscape',
        model: 'civitai:123@456',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.width).toBe(1024);
        expect(result.data.height).toBe(1024);
        expect(result.data.numberResults).toBe(1);
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should reject missing positivePrompt', () => {
      const result = imageInferenceInputSchema.safeParse({
        model: 'civitai:123@456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing model', () => {
      const result = imageInferenceInputSchema.safeParse({
        positivePrompt: 'a cat',
      });
      expect(result.success).toBe(false);
    });

    it('should validate optional parameters', () => {
      const result = imageInferenceInputSchema.safeParse({
        positivePrompt: 'a cat on a couch',
        model: 'civitai:123@456',
        width: 512,
        height: 768,
        steps: 30,
        CFGScale: 7.5,
        numberResults: 4,
        negativePrompt: 'blurry, low quality',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(imageInferenceToolDefinition.name).toBe('imageInference');
    });

    it('should require positivePrompt and model', () => {
      expect(imageInferenceToolDefinition.inputSchema.required).toContain('positivePrompt');
      expect(imageInferenceToolDefinition.inputSchema.required).toContain('model');
    });

    it('should have a description', () => {
      expect(imageInferenceToolDefinition.description).toBeTruthy();
    });
  });
});
