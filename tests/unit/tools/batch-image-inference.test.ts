// Does:  Proves batchImageInference bounds the prompt list and aggregates successes, failures and cost across prompts.
// Holds: config, rate limiter and RunwareClient are mocked; the schema, concurrency and aggregation logic run for real.

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { batchImageInference } from '../../../src/tools/batch-image-inference/handler.js';
import { batchImageInferenceInputSchema } from '../../../src/tools/batch-image-inference/schema.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('batchImageInference', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('schema bounds', () => {
    it('should reject empty prompts array', () => {
      const result = batchImageInferenceInputSchema.safeParse({
        prompts: [],
        model: 'civitai:123@456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 20 prompts', () => {
      const result = batchImageInferenceInputSchema.safeParse({
        prompts: Array.from({ length: 21 }, (_, i) => `prompt ${i}`),
        model: 'civitai:123@456',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('aggregation', () => {
    it('should process all prompts successfully', async () => {
      let callCount = 0;
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount += 1;
        return Promise.resolve({
          taskType: 'imageInference',
          taskUUID: `task-uuid-${callCount}`,
          imageUUID: `image-uuid-${callCount}`,
          imageURL: `https://example.com/image-${callCount}.jpg`,
          cost: 0.005,
        });
      });

      const input = batchImageInferenceInputSchema.parse({
        prompts: ['a cat', 'a dog'],
        model: 'civitai:123@456',
      });

      const result = await batchImageInference(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('2');

      const data = result.data as { total: number; successful: number; failed: number; results: unknown[] };
      expect(data.total).toBe(2);
      expect(data.successful).toBe(2);
      expect(data.failed).toBe(0);
      expect(data.results).toHaveLength(2);
    });

    it('should handle partial failures', async () => {
      let callCount = 0;
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve({
            taskType: 'imageInference',
            taskUUID: 'task-uuid-1',
            imageUUID: 'image-uuid-1',
            imageURL: 'https://example.com/image-1.jpg',
            cost: 0.005,
          });
        }
        return Promise.reject(new Error('Generation failed'));
      });

      const input = batchImageInferenceInputSchema.parse({
        prompts: ['a cat', 'a dog'],
        model: 'civitai:123@456',
      });

      const result = await batchImageInference(input, mockClient);

      expect(result.status).toBe('success');
      const data = result.data as { successful: number; failed: number };
      expect(data.successful).toBe(1);
      expect(data.failed).toBe(1);
    });

    it('should return error when all prompts fail', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));

      const input = batchImageInferenceInputSchema.parse({
        prompts: ['a cat', 'a dog'],
        model: 'civitai:123@456',
      });

      const result = await batchImageInference(input, mockClient);

      expect(result.status).toBe('error');
      const data = result.data as { successful: number; failed: number };
      expect(data.successful).toBe(0);
      expect(data.failed).toBe(2);
    });

    it('should aggregate costs across all prompts', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'imageInference',
        taskUUID: 'task-uuid',
        imageUUID: 'image-uuid',
        cost: 0.003,
      });

      const input = batchImageInferenceInputSchema.parse({
        prompts: ['a cat', 'a dog', 'a bird'],
        model: 'civitai:123@456',
      });

      const result = await batchImageInference(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.cost).toBeCloseTo(0.009, 5);
    });
  });
});
