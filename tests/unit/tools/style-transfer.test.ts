/**
 * Unit tests for the style transfer tool.
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

// Mock the imageCaption and imageInference tools that styleTransfer depends on
vi.mock('../../../src/tools/image-caption/index.js', () => ({
  imageCaption: vi.fn(),
}));

vi.mock('../../../src/tools/image-inference/index.js', () => ({
  imageInference: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import { styleTransfer, styleTransferToolDefinition } from '../../../src/tools/style-transfer/handler.js';
import { styleTransferInputSchema } from '../../../src/tools/style-transfer/schema.js';
import { imageCaption } from '../../../src/tools/image-caption/index.js';
import { imageInference } from '../../../src/tools/image-inference/index.js';
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

describe('styleTransfer', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(styleTransferToolDefinition.name).toBe('styleTransfer');
    });

    it('should require inputImage and style', () => {
      expect(styleTransferToolDefinition.inputSchema.required).toContain('inputImage');
      expect(styleTransferToolDefinition.inputSchema.required).toContain('style');
    });

    it('should have a description', () => {
      expect(styleTransferToolDefinition.description).toBeTruthy();
    });
  });

  describe('schema validation', () => {
    it('should accept valid input with subject', () => {
      const result = styleTransferInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        style: 'oil-painting',
        subject: 'a beautiful landscape',
      });
      expect(result.success).toBe(true);
    });

    it('should apply defaults for intensity, colorPalette, model, strength', () => {
      const result = styleTransferInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        style: 'watercolor',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.intensity).toBe('moderate');
        expect(result.data.colorPalette).toBe('vibrant');
        expect(result.data.model).toBe('runware:100@1');
        expect(result.data.strength).toBe(0.65);
        expect(result.data.includeCost).toBe(true);
      }
    });

    it('should accept all valid art styles', () => {
      const styles = [
        'oil-painting', 'watercolor', 'pencil-sketch', 'pop-art',
        'impressionist', 'cyberpunk', 'studio-ghibli', 'art-deco',
        'minimalist', 'surrealist',
      ];
      for (const style of styles) {
        const result = styleTransferInputSchema.safeParse({
          inputImage: 'https://example.com/image.jpg',
          style,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid style', () => {
      const result = styleTransferInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        style: 'invalid-style',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid intensity', () => {
      const result = styleTransferInputSchema.safeParse({
        inputImage: 'https://example.com/image.jpg',
        style: 'oil-painting',
        intensity: 'extreme',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handler success case with subject provided', () => {
    it('should skip auto-captioning and generate styled image', async () => {
      const mockImageInference = imageInference as ReturnType<typeof vi.fn>;
      mockImageInference.mockResolvedValue({
        status: 'success',
        message: 'Image generated',
        data: {
          images: [
            {
              imageUUID: 'styled-uuid-123',
              imageURL: 'https://example.com/styled.jpg',
            },
          ],
          cost: 0.01,
        },
        cost: 0.01,
      });

      const input = styleTransferInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        style: 'oil-painting',
        subject: 'a mountain landscape',
      });

      const result = await styleTransfer(input, mockClient);

      expect(result.status).toBe('success');
      expect(result.message).toContain('oil-painting');
      expect(imageCaption).not.toHaveBeenCalled();
      expect(imageInference).toHaveBeenCalled();

      const data = result.data as { imageUUID: string; style: string; prompt: string };
      expect(data.imageUUID).toBe('styled-uuid-123');
      expect(data.style).toBe('oil-painting');
      expect(data.prompt).toContain('mountain landscape');
      expect(data.prompt).toContain('oil painting');
    });
  });

  describe('handler success case with auto-captioning', () => {
    it('should auto-caption when no subject is provided', async () => {
      const mockImageCaption = imageCaption as ReturnType<typeof vi.fn>;
      mockImageCaption.mockResolvedValue({
        status: 'success',
        message: 'Captioned',
        data: { text: 'a sunset over the ocean' },
        cost: 0.001,
      });

      const mockImageInference = imageInference as ReturnType<typeof vi.fn>;
      mockImageInference.mockResolvedValue({
        status: 'success',
        message: 'Image generated',
        data: {
          images: [
            {
              imageUUID: 'styled-uuid-456',
              imageURL: 'https://example.com/styled-sunset.jpg',
            },
          ],
          cost: 0.01,
        },
        cost: 0.01,
      });

      const input = styleTransferInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        style: 'watercolor',
      });

      const result = await styleTransfer(input, mockClient);

      expect(result.status).toBe('success');
      expect(imageCaption).toHaveBeenCalled();
      expect(imageInference).toHaveBeenCalled();

      const data = result.data as { captionUsed?: string };
      expect(data.captionUsed).toBe('a sunset over the ocean');
    });
  });

  describe('handler error case', () => {
    it('should return error when caption fails', async () => {
      const mockImageCaption = imageCaption as ReturnType<typeof vi.fn>;
      mockImageCaption.mockResolvedValue({
        status: 'error',
        message: 'Caption failed',
      });

      const input = styleTransferInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        style: 'cyberpunk',
      });

      const result = await styleTransfer(input, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Auto-caption failed');
    });

    it('should return error when inference fails', async () => {
      const mockImageInference = imageInference as ReturnType<typeof vi.fn>;
      mockImageInference.mockResolvedValue({
        status: 'error',
        message: 'Generation failed',
      });

      const input = styleTransferInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        style: 'pop-art',
        subject: 'a cat',
      });

      const result = await styleTransfer(input, mockClient);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Style transfer generation failed');
    });
  });

  describe('cost tracking', () => {
    it('should aggregate costs from caption and inference', async () => {
      const mockImageCaption = imageCaption as ReturnType<typeof vi.fn>;
      mockImageCaption.mockResolvedValue({
        status: 'success',
        message: 'Captioned',
        data: { text: 'a dog' },
        cost: 0.002,
      });

      const mockImageInference = imageInference as ReturnType<typeof vi.fn>;
      mockImageInference.mockResolvedValue({
        status: 'success',
        message: 'Generated',
        data: {
          images: [{ imageUUID: 'uuid', imageURL: 'https://example.com/img.jpg' }],
          cost: 0.01,
        },
        cost: 0.01,
      });

      const input = styleTransferInputSchema.parse({
        inputImage: 'https://example.com/image.jpg',
        style: 'impressionist',
      });

      const result = await styleTransfer(input, mockClient);

      expect(result.status).toBe('success');
      // total = captionCost(0.002) + generationCost(0.01) = 0.012
      expect(result.cost).toBeCloseTo(0.012, 5);
    });
  });
});
