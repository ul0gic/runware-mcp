import { describe, it, expect, vi } from 'vitest';

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
  getVideoModelInfo,
  getVideoModelInfoToolDefinition,
  getVideoModelInfoInputSchema,
} from '../../../src/tools/get-video-model-info/index.js';

describe('getVideoModelInfo', () => {
  describe('handler', () => {
    it('should return success for a known model', () => {
      const result = getVideoModelInfo({ modelId: 'klingai:1@1' });

      expect(result.status).toBe('success');
      expect(result.message).toContain('Video model:');

      const data = result.data as {
        id: string;
        name: string;
        provider: string;
        maxWidth: number;
        maxHeight: number;
        minDuration: number;
        maxDuration: number;
        supportsFPS: boolean;
        supportsAudio: boolean;
        supportsImageInput: boolean;
        supportsVideoInput: boolean;
        features: string[];
      };

      expect(data.id).toBe('klingai:1@1');
      expect(data.provider).toBe('klingai');
      expect(typeof data.name).toBe('string');
      expect(typeof data.maxWidth).toBe('number');
      expect(typeof data.maxHeight).toBe('number');
      expect(typeof data.minDuration).toBe('number');
      expect(typeof data.maxDuration).toBe('number');
      expect(typeof data.supportsFPS).toBe('boolean');
      expect(typeof data.supportsAudio).toBe('boolean');
      expect(typeof data.supportsImageInput).toBe('boolean');
      expect(typeof data.supportsVideoInput).toBe('boolean');
      expect(Array.isArray(data.features)).toBe(true);
    });

    it('should return error for unknown model', () => {
      const result = getVideoModelInfo({ modelId: 'nonexistent:999@999' });

      expect(result.status).toBe('error');
      expect(result.message).toContain('not found');
      expect(result.message).toContain('nonexistent:999@999');
    });

    it('should return detailed info with all expected fields', () => {
      const result = getVideoModelInfo({ modelId: 'klingai:1@1' });

      expect(result.status).toBe('success');
      const data = result.data as Record<string, unknown>;

      // Required fields
      expect(data.id).toBeDefined();
      expect(data.name).toBeDefined();
      expect(data.provider).toBeDefined();
      expect(data.maxWidth).toBeDefined();
      expect(data.maxHeight).toBeDefined();
      expect(data.minDuration).toBeDefined();
      expect(data.maxDuration).toBeDefined();
      expect(data.supportsFPS).toBeDefined();
      expect(data.supportsAudio).toBeDefined();
      expect(data.supportsImageInput).toBeDefined();
      expect(data.supportsVideoInput).toBeDefined();
      expect(data.features).toBeDefined();
    });
  });

  describe('schema', () => {
    it('should validate correct input', () => {
      const result = getVideoModelInfoInputSchema.safeParse({
        modelId: 'klingai:1.5@2',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing modelId', () => {
      const result = getVideoModelInfoInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept any string as modelId', () => {
      const result = getVideoModelInfoInputSchema.safeParse({
        modelId: 'any-string-here',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(getVideoModelInfoToolDefinition.name).toBe('getVideoModelInfo');
    });

    it('should require modelId', () => {
      expect(getVideoModelInfoToolDefinition.inputSchema.required).toContain('modelId');
    });

    it('should have a description', () => {
      expect(getVideoModelInfoToolDefinition.description).toBeTruthy();
    });
  });
});
