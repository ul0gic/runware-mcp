// Does:  Proves imageMasking bounds confidence and detection count, counts detections, and reports client failures.
// Holds: config, rate limiter and RunwareClient are mocked; the schema and handler run for real.

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

import { imageMasking, imageMaskingInputSchema } from '../../../src/tools/image-masking/index.js';
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

  describe('schema bounds', () => {
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

  describe('handler', () => {
    it('should count multiple detections in the message', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
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
      });

      const result = await imageMasking(
        imageMaskingInputSchema.parse({ inputImage: 'https://example.com/face.jpg' }),
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('Detected 2 elements');

      const data = result.data as { maskImageUUID: string; detections: unknown[] };
      expect(data.maskImageUUID).toBe('mask-image-uuid');
      expect(data.detections).toHaveLength(2);
    });

    it('should use the singular for one detection', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'imageMasking',
        taskUUID: 'uuid',
        imageUUID: 'mask-uuid',
        maskImageURL: 'https://example.com/mask.png',
        detections: [{ x_min: 10, y_min: 20, x_max: 100, y_max: 150 }],
        cost: 0.002,
      });

      const result = await imageMasking(
        imageMaskingInputSchema.parse({ inputImage: 'https://example.com/face.jpg' }),
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('Detected 1 element');
    });

    it('should default to no detections when the response has none', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        taskType: 'imageMasking',
        taskUUID: 'uuid',
        imageUUID: 'mask-uuid',
        maskImageURL: 'https://example.com/mask.png',
        cost: 0.002,
      });

      const result = await imageMasking(
        imageMaskingInputSchema.parse({ inputImage: 'https://example.com/image.jpg' }),
        mockClient,
      );

      expect(result.status).toBe('success');
      const data = result.data as { detections: unknown[] };
      expect(data.detections).toHaveLength(0);
    });

    it('should return error when API fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Masking failed'));

      const result = await imageMasking(
        imageMaskingInputSchema.parse({ inputImage: 'https://example.com/image.jpg' }),
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Masking failed');
    });
  });
});
