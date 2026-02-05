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
  photoMaker,
  photoMakerToolDefinition,
  photoMakerInputSchema,
} from '../../../src/tools/photo-maker/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('photoMaker', () => {
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
            taskType: 'photoMaker',
            taskUUID: 'test-task-uuid',
            imageUUID: 'test-image-uuid',
            imageURL: 'https://example.com/photo.png',
            cost: 0.02,
            seed: 123,
          },
        ],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await photoMaker(
        {
          positivePrompt: 'img a person in a park',
          inputImages: ['https://example.com/face.jpg'],
        },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('identity-preserving image');

      const data = result.data as { images: { imageUUID: string }[] };
      expect(data.images).toHaveLength(1);
      expect(data.images[0]?.imageUUID).toBe('test-image-uuid');
    });

    it('should auto-prepend trigger word when not present', async () => {
      const mockResponse = {
        data: [
          {
            taskType: 'photoMaker',
            taskUUID: 'uuid',
            imageUUID: 'img-uuid',
            imageURL: 'https://example.com/photo.png',
            cost: 0.02,
          },
        ],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await photoMaker(
        {
          positivePrompt: 'a person in a park',
          inputImages: ['https://example.com/face.jpg'],
        },
        mockClient,
      );

      // Verify the request was called with trigger word prepended
      const callArgs = (mockClient.request as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const tasks = callArgs[0] as { positivePrompt?: string }[];
      expect(tasks[0]?.positivePrompt).toContain('img');
    });

    it('should not duplicate trigger word when already present', async () => {
      const mockResponse = {
        data: [
          {
            taskType: 'photoMaker',
            taskUUID: 'uuid',
            imageUUID: 'img-uuid',
            imageURL: 'https://example.com/photo.png',
            cost: 0.02,
          },
        ],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await photoMaker(
        {
          positivePrompt: 'img a person smiling',
          inputImages: ['https://example.com/face.jpg'],
        },
        mockClient,
      );

      const callArgs = (mockClient.request as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const tasks = callArgs[0] as { positivePrompt?: string }[];
      // Should not be "img img a person smiling"
      expect(tasks[0]?.positivePrompt).toBe('img a person smiling');
    });

    it('should return error when API fails', async () => {
      (mockClient.request as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network timeout'),
      );

      const result = await photoMaker(
        {
          positivePrompt: 'a person',
          inputImages: ['https://example.com/face.jpg'],
        },
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Network timeout');
    });

    it('should propagate cost from response', async () => {
      const mockResponse = {
        data: [
          {
            taskType: 'photoMaker',
            taskUUID: 'uuid',
            imageUUID: 'img-uuid',
            imageURL: 'https://example.com/photo.png',
            cost: 0.03,
          },
        ],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await photoMaker(
        {
          positivePrompt: 'img a person',
          inputImages: ['https://example.com/face.jpg'],
        },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.cost).toBe(0.03);
    });
  });

  describe('schema', () => {
    it('should validate correct input with required fields', () => {
      const result = photoMakerInputSchema.safeParse({
        positivePrompt: 'img a person in the mountains',
        inputImages: ['https://example.com/face.jpg'],
      });
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = photoMakerInputSchema.safeParse({
        positivePrompt: 'img a person',
        inputImages: ['https://example.com/face.jpg'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('civitai:139562@344487');
        expect(result.data.width).toBe(1024);
        expect(result.data.height).toBe(1024);
        expect(result.data.styleStrength).toBe(0.5);
        expect(result.data.numberResults).toBe(1);
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should reject missing positivePrompt', () => {
      const result = photoMakerInputSchema.safeParse({
        inputImages: ['https://example.com/face.jpg'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing inputImages', () => {
      const result = photoMakerInputSchema.safeParse({
        positivePrompt: 'img a person',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty inputImages array', () => {
      const result = photoMakerInputSchema.safeParse({
        positivePrompt: 'img a person',
        inputImages: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 4 inputImages', () => {
      const result = photoMakerInputSchema.safeParse({
        positivePrompt: 'img a person',
        inputImages: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(photoMakerToolDefinition.name).toBe('photoMaker');
    });

    it('should require positivePrompt and inputImages', () => {
      expect(photoMakerToolDefinition.inputSchema.required).toContain('positivePrompt');
      expect(photoMakerToolDefinition.inputSchema.required).toContain('inputImages');
    });

    it('should have a description', () => {
      expect(photoMakerToolDefinition.description).toBeTruthy();
    });
  });
});
