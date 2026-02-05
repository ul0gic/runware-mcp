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
  listVideoModels,
  listVideoModelsToolDefinition,
  listVideoModelsInputSchema,
} from '../../../src/tools/list-video-models/index.js';

describe('listVideoModels', () => {
  describe('handler', () => {
    it('should return success with no filters (all models)', () => {
      const result = listVideoModels({});

      expect(result.status).toBe('success');
      expect(result.message).toContain('video model');

      const data = result.data as { models: unknown[]; count: number; providers: string[] };
      expect(data.count).toBeGreaterThan(0);
      expect(data.models.length).toBe(data.count);
      expect(data.providers.length).toBeGreaterThan(0);
    });

    it('should filter by provider', () => {
      const result = listVideoModels({ provider: 'klingai' });

      expect(result.status).toBe('success');

      const data = result.data as {
        models: { provider: string }[];
        count: number;
        providers: string[];
      };
      expect(data.count).toBeGreaterThan(0);
      for (const model of data.models) {
        expect(model.provider).toBe('klingai');
      }
    });

    it('should filter by supportsAudio', () => {
      const result = listVideoModels({ supportsAudio: true });

      expect(result.status).toBe('success');

      const data = result.data as {
        models: { supportsAudio: boolean }[];
        count: number;
      };
      for (const model of data.models) {
        expect(model.supportsAudio).toBe(true);
      }
    });

    it('should filter by supportsImageInput', () => {
      const result = listVideoModels({ supportsImageInput: true });

      expect(result.status).toBe('success');

      const data = result.data as {
        models: { supportsImageInput: boolean }[];
      };
      for (const model of data.models) {
        expect(model.supportsImageInput).toBe(true);
      }
    });

    it('should return empty results for non-matching filter', () => {
      const result = listVideoModels({ provider: 'klingai', minDuration: 999 });

      expect(result.status).toBe('success');
      expect(result.message).toContain('No video models found');

      const data = result.data as { models: unknown[]; count: number };
      expect(data.count).toBe(0);
      expect(data.models).toHaveLength(0);
    });

    it('should return model summaries with expected fields', () => {
      const result = listVideoModels({});

      const data = result.data as {
        models: {
          id: string;
          name: string;
          provider: string;
          maxWidth: number;
          maxHeight: number;
          minDuration: number;
          maxDuration: number;
          supportsAudio: boolean;
          supportsImageInput: boolean;
          supportsVideoInput: boolean;
          features: string[];
        }[];
      };

      const firstModel = data.models[0];
      expect(firstModel).toBeDefined();
      if (firstModel !== undefined) {
        expect(typeof firstModel.id).toBe('string');
        expect(typeof firstModel.name).toBe('string');
        expect(typeof firstModel.provider).toBe('string');
        expect(typeof firstModel.maxWidth).toBe('number');
        expect(typeof firstModel.maxHeight).toBe('number');
        expect(typeof firstModel.minDuration).toBe('number');
        expect(typeof firstModel.maxDuration).toBe('number');
        expect(typeof firstModel.supportsAudio).toBe('boolean');
        expect(typeof firstModel.supportsImageInput).toBe('boolean');
        expect(typeof firstModel.supportsVideoInput).toBe('boolean');
        expect(Array.isArray(firstModel.features)).toBe(true);
      }
    });
  });

  describe('schema', () => {
    it('should validate empty object (no filters)', () => {
      const result = listVideoModelsInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate provider filter', () => {
      const result = listVideoModelsInputSchema.safeParse({
        provider: 'klingai',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid provider', () => {
      const result = listVideoModelsInputSchema.safeParse({
        provider: 'invalid-provider',
      });
      expect(result.success).toBe(false);
    });

    it('should validate minDuration filter', () => {
      const result = listVideoModelsInputSchema.safeParse({
        minDuration: 10,
      });
      expect(result.success).toBe(true);
    });

    it('should validate boolean filters', () => {
      const result = listVideoModelsInputSchema.safeParse({
        supportsAudio: true,
        supportsImageInput: false,
        supportsVideoInput: true,
      });
      expect(result.success).toBe(true);
    });

    it('should validate feature filter', () => {
      const result = listVideoModelsInputSchema.safeParse({
        feature: '1080p',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(listVideoModelsToolDefinition.name).toBe('listVideoModels');
    });

    it('should have a description', () => {
      expect(listVideoModelsToolDefinition.description).toBeTruthy();
    });
  });
});
