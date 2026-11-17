// Does:  Video model catalog keys agree with their ids and getVideoModel resolves only catalogued ids.
// Holds: config is mocked; the real video-models catalog is read.

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

import { VIDEO_MODELS, getVideoModel } from '../../../src/constants/video-models.js';

describe('VIDEO_MODELS', () => {
  it('every model has an id that matches its key', () => {
    for (const key of Object.keys(VIDEO_MODELS)) {
      const model = VIDEO_MODELS[key as keyof typeof VIDEO_MODELS];
      expect(model.id).toBe(key);
    }
  });
});

describe('getVideoModel', () => {
  it('returns model for valid ID', () => {
    const model = getVideoModel('klingai:1@1');
    expect(model).toBeDefined();
    expect(model?.name).toBe('Kling 1.0 Standard');
    expect(model?.provider).toBe('klingai');
  });

  it('returns undefined for invalid ID', () => {
    expect(getVideoModel('nonexistent:model')).toBeUndefined();
    expect(getVideoModel('')).toBeUndefined();
  });
});
