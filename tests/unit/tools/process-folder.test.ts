/**
 * Unit tests for the process folder tool.
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

vi.mock('../../../src/shared/file-utils.js', () => ({
  readFileAsBase64: vi.fn().mockResolvedValue('base64data'),
  validateFilePath: vi.fn().mockResolvedValue('/valid/path'),
  getFileMimeType: vi.fn().mockReturnValue('image/jpeg'),
  validateFileSize: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/shared/folder-utils.js', () => ({
  validateFolder: vi.fn().mockResolvedValue('/valid/folder'),
  getImagesInFolder: vi.fn().mockResolvedValue(['/valid/folder/image1.jpg', '/valid/folder/image2.jpg']),
  IMAGE_EXTENSIONS: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']),
}));

// Mock underlying tool handlers
vi.mock('../../../src/tools/image-upscale/index.js', () => ({
  imageUpscale: vi.fn(),
}));

vi.mock('../../../src/tools/image-background-removal/index.js', () => ({
  imageBackgroundRemoval: vi.fn(),
}));

vi.mock('../../../src/tools/image-caption/index.js', () => ({
  imageCaption: vi.fn(),
}));

vi.mock('../../../src/tools/vectorize/index.js', () => ({
  vectorize: vi.fn(),
}));

vi.mock('../../../src/tools/controlnet-preprocess/index.js', () => ({
  controlNetPreprocess: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import { processFolder, processFolderToolDefinition } from '../../../src/tools/process-folder/handler.js';
import { processFolderInputSchema } from '../../../src/tools/process-folder/schema.js';
import { imageUpscale } from '../../../src/tools/image-upscale/index.js';
import { getImagesInFolder } from '../../../src/shared/folder-utils.js';
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

describe('processFolder', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    // Re-set folder-utils mocks since clearAllMocks does not reset implementations
    // that may have been overridden by individual tests (e.g., "no images found" test).
    const mockGetImages = getImagesInFolder as ReturnType<typeof vi.fn>;
    mockGetImages.mockResolvedValue(['/valid/folder/image1.jpg', '/valid/folder/image2.jpg']);
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(processFolderToolDefinition.name).toBe('processFolder');
    });

    it('should require folderPath and operation', () => {
      expect(processFolderToolDefinition.inputSchema.required).toContain('folderPath');
      expect(processFolderToolDefinition.inputSchema.required).toContain('operation');
    });

    it('should have a description', () => {
      expect(processFolderToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept valid input', () => {
      const result = processFolderInputSchema.safeParse({
        folderPath: '/valid/folder',
        operation: 'upscale',
      });
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const result = processFolderInputSchema.safeParse({
        folderPath: '/valid/folder',
        operation: 'upscale',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recursive).toBe(false);
        expect(result.data.maxFiles).toBe(50);
        expect(result.data.outputSuffix).toBe('_processed');
        expect(result.data.concurrency).toBe(2);
        expect(result.data.stopOnError).toBe(false);
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should accept all valid operations', () => {
      const operations = ['upscale', 'removeBackground', 'caption', 'vectorize', 'controlNetPreprocess'];
      for (const operation of operations) {
        const result = processFolderInputSchema.safeParse({
          folderPath: '/valid/folder',
          operation,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid operation', () => {
      const result = processFolderInputSchema.safeParse({
        folderPath: '/valid/folder',
        operation: 'invalidOp',
      });
      expect(result.success).toBe(false);
    });

    it('should reject relative path', () => {
      const result = processFolderInputSchema.safeParse({
        folderPath: 'relative/path',
        operation: 'upscale',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handler success case', () => {
    it('should process all images in folder successfully', async () => {
      const mockImageUpscale = imageUpscale as ReturnType<typeof vi.fn>;
      mockImageUpscale.mockResolvedValue({
        status: 'success',
        message: 'Upscaled',
        data: { imageUUID: 'upscaled-uuid', imageURL: 'https://example.com/upscaled.jpg' },
        cost: 0.002,
      });

      const input = processFolderInputSchema.parse({
        folderPath: '/valid/folder',
        operation: 'upscale',
      });

      const result = await processFolder(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('2');

      const data = result.data as { processed: number; failed: number; total: number };
      expect(data.processed).toBe(2);
      expect(data.failed).toBe(0);
      expect(data.total).toBe(2);
    });

    it('should return success with no images found', async () => {
      const mockGetImages = getImagesInFolder as ReturnType<typeof vi.fn>;
      mockGetImages.mockResolvedValue([]);

      const input = processFolderInputSchema.parse({
        folderPath: '/valid/folder',
        operation: 'upscale',
      });

      const result = await processFolder(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('No images found');
    });
  });

  describe('handler error case', () => {
    it('should handle partial failures gracefully', async () => {
      const mockImageUpscale = imageUpscale as ReturnType<typeof vi.fn>;
      mockImageUpscale
        .mockResolvedValueOnce({
          status: 'success',
          message: 'Upscaled',
          data: { imageUUID: 'uuid' },
          cost: 0.002,
        })
        .mockResolvedValueOnce({
          status: 'error',
          message: 'Failed to process',
        });

      const input = processFolderInputSchema.parse({
        folderPath: '/valid/folder',
        operation: 'upscale',
      });

      const result = await processFolder(input, mockClient);

      expect(result.status).toBe('success');
      const data = result.data as { processed: number; failed: number };
      expect(data.processed).toBe(1);
      expect(data.failed).toBe(1);
    });
  });

  describe('cost tracking', () => {
    it('should aggregate costs across all files', async () => {
      const mockImageUpscale = imageUpscale as ReturnType<typeof vi.fn>;
      mockImageUpscale.mockResolvedValue({
        status: 'success',
        message: 'Upscaled',
        data: { imageUUID: 'uuid' },
        cost: 0.005,
      });

      const input = processFolderInputSchema.parse({
        folderPath: '/valid/folder',
        operation: 'upscale',
      });

      const result = await processFolder(input, mockClient);

      expect(result.status).toBe('success');
      // 2 files * 0.005 each = 0.01
      expect(result.cost).toBeCloseTo(0.01, 5);
    });
  });
});
