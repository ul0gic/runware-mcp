// Does:  Proves listVideoModels filters the real video model table by provider, audio and image-input flags.
// Holds: config is mocked; the handler runs against the real VIDEO_MODELS constants with no client.

import { describe, expect, it, vi } from 'vitest';

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

import { listVideoModels } from '../../../src/tools/list-video-models/index.js';

describe('listVideoModels', () => {
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
});
