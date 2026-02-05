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
  modelSearch,
  modelSearchToolDefinition,
  modelSearchInputSchema,
} from '../../../src/tools/model-search/index.js';
import type { RunwareClient } from '../../../src/integrations/runware/client.js';

function createMockClient(): RunwareClient {
  return {
    request: vi.fn(),
    requestSingle: vi.fn(),
    generateTaskUUID: vi.fn().mockReturnValue('mock-uuid'),
  } as unknown as RunwareClient;
}

describe('modelSearch', () => {
  let mockClient: RunwareClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('handler', () => {
    it('should return success with search results', async () => {
      const mockResponse = {
        data: [
          {
            air: 'civitai:123@456',
            name: 'Anime Style Model',
            category: 'checkpoint',
            architecture: 'SDXL',
            tags: ['anime', 'style'],
            totalResults: 1,
          },
        ],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await modelSearch(
        { search: 'anime' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('Found');
      expect(result.message).toContain('anime');

      const data = result.data as {
        models: { air: string; name: string }[];
        totalResults: number;
        offset: number;
        limit: number;
      };
      expect(data.models).toHaveLength(1);
      expect(data.models[0]?.air).toBe('civitai:123@456');
      expect(data.models[0]?.name).toBe('Anime Style Model');
      expect(data.totalResults).toBe(1);
    });

    it('should return success with empty results', async () => {
      const mockResponse = {
        data: [],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await modelSearch(
        { search: 'nonexistent-model-xyz' },
        mockClient,
      );

      expect(result.status).toBe('success');
      expect(result.message).toContain('No models found');

      const data = result.data as { models: unknown[]; totalResults: number };
      expect(data.models).toHaveLength(0);
      expect(data.totalResults).toBe(0);
    });

    it('should return success with no search term (list all)', async () => {
      const mockResponse = {
        data: [
          {
            air: 'civitai:100@200',
            name: 'Model A',
            totalResults: 2,
          },
          {
            air: 'civitai:101@201',
            name: 'Model B',
            totalResults: 2,
          },
        ],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await modelSearch({}, mockClient);

      expect(result.status).toBe('success');
      const data = result.data as { models: unknown[] };
      expect(data.models).toHaveLength(2);
    });

    it('should return error when API fails', async () => {
      (mockClient.request as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Search API unavailable'),
      );

      const result = await modelSearch(
        { search: 'anime' },
        mockClient,
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Search API unavailable');
    });

    it('should pass pagination parameters', async () => {
      const mockResponse = {
        data: [],
      };

      (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await modelSearch(
        { search: 'test', limit: 50, offset: 10 },
        mockClient,
      );

      expect(result.status).toBe('success');

      const data = result.data as { offset: number; limit: number };
      expect(data.offset).toBe(10);
      expect(data.limit).toBe(50);
    });
  });

  describe('schema', () => {
    it('should validate empty object (no filters)', () => {
      const result = modelSearchInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = modelSearchInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should validate search term', () => {
      const result = modelSearchInputSchema.safeParse({
        search: 'anime',
      });
      expect(result.success).toBe(true);
    });

    it('should validate category filter', () => {
      const result = modelSearchInputSchema.safeParse({
        category: 'checkpoint',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const result = modelSearchInputSchema.safeParse({
        category: 'invalid-category',
      });
      expect(result.success).toBe(false);
    });

    it('should validate type filter', () => {
      const result = modelSearchInputSchema.safeParse({
        type: 'base',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const result = modelSearchInputSchema.safeParse({
        type: 'invalid-type',
      });
      expect(result.success).toBe(false);
    });

    it('should validate pagination limits', () => {
      const result = modelSearchInputSchema.safeParse({
        limit: 100,
        offset: 50,
      });
      expect(result.success).toBe(true);
    });

    it('should reject limit above 100', () => {
      const result = modelSearchInputSchema.safeParse({
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const result = modelSearchInputSchema.safeParse({
        offset: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should validate tags filter', () => {
      const result = modelSearchInputSchema.safeParse({
        tags: ['anime', 'realistic'],
      });
      expect(result.success).toBe(true);
    });

    it('should validate visibility filter', () => {
      const result = modelSearchInputSchema.safeParse({
        visibility: 'public',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(modelSearchToolDefinition.name).toBe('modelSearch');
    });

    it('should have a description', () => {
      expect(modelSearchToolDefinition.description).toBeTruthy();
    });
  });
});
