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
  getMaxFileSizeBytes: vi.fn().mockReturnValue(50 * 1024 * 1024),
}));

vi.mock('../../../src/shared/file-utils.js', () => ({
  validateFilePath: vi.fn().mockResolvedValue('/valid/path/image.jpg'),
  validateFileType: vi.fn(),
}));

import {
  imageUpload,
  imageUploadToolDefinition,
  imageUploadInputSchema,
} from '../../../src/tools/image-upload/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('imageUpload', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('handler', () => {
    it('should return success when uploading via URL', async () => {
      const mockResponse = {
        taskType: 'imageUpload',
        taskUUID: 'test-task-uuid',
        imageUUID: 'uploaded-image-uuid',
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageUpload(
        { url: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('uploaded');
      expect(result.message).toContain('uploaded-image-uuid');

      const data = result.data as { imageUUID: string };
      expect(data.imageUUID).toBe('uploaded-image-uuid');
    });

    it('should return success when uploading via base64', async () => {
      const mockResponse = {
        taskType: 'imageUpload',
        taskUUID: 'test-task-uuid',
        imageUUID: 'uploaded-uuid',
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageUpload(
        { base64: 'iVBORw0KGgoAAAANSUhEUg==' },
        mockClient,
      );

      expect(result.status).toBe('success');
      const data = result.data as { imageUUID: string };
      expect(data.imageUUID).toBe('uploaded-uuid');
    });

    it('should return success when uploading via dataUri', async () => {
      const mockResponse = {
        taskType: 'imageUpload',
        taskUUID: 'uuid',
        imageUUID: 'uploaded-uuid',
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageUpload(
        { dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==' },
        mockClient,
      );

      expect(result.status).toBe('success');
    });

    it('should return success when uploading via image field', async () => {
      const mockResponse = {
        taskType: 'imageUpload',
        taskUUID: 'uuid',
        imageUUID: 'uploaded-uuid',
      };

      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await imageUpload(
        { image: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('success');
    });

    it('should return error when API fails', async () => {
      (mockClient.requestSingle as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Upload failed'),
      );

      const result = await imageUpload(
        { url: 'https://example.com/image.jpg' },
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Upload failed');
    });
  });

  describe('schema', () => {
    it('should validate input with url', () => {
      const result = imageUploadInputSchema.safeParse({
        url: 'https://example.com/image.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should validate input with base64', () => {
      const result = imageUploadInputSchema.safeParse({
        base64: 'iVBORw0KGgoAAAANSUhEUg==',
      });
      expect(result.success).toBe(true);
    });

    it('should validate input with dataUri', () => {
      const result = imageUploadInputSchema.safeParse({
        dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      });
      expect(result.success).toBe(true);
    });

    it('should validate input with image field', () => {
      const result = imageUploadInputSchema.safeParse({
        image: 'https://example.com/image.png',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty object (no image source)', () => {
      const result = imageUploadInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(imageUploadToolDefinition.name).toBe('imageUpload');
    });

    it('should have a description', () => {
      expect(imageUploadToolDefinition.description).toBeTruthy();
    });
  });
});
