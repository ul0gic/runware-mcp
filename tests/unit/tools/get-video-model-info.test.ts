// Does:  Proves getVideoModelInfo returns the full capability record for a known model and errors on an unknown one.
// Holds: Only config is mocked; lookups run against the real video model table.

import { describe, it, expect, vi } from 'vitest';

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

import { getVideoModelInfo } from '../../../src/tools/get-video-model-info/index.js';

describe('getVideoModelInfo', () => {
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
});
