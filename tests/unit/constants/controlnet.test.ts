// Does:  ControlNet preprocessor lookup resolves API ids to internal entries and rejects unknown ids.
// Holds: config is mocked; the real controlnet catalog is read.

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

import { getPreprocessor, isValidApiPreprocessor } from '../../../src/constants/controlnet.js';

describe('getPreprocessor', () => {
  it('returns preprocessor by API ID (lineart_anime)', () => {
    const p = getPreprocessor('lineart_anime');
    expect(p).toBeDefined();
    expect(p?.id).toBe('lineartAnime');
  });

  it('returns undefined for invalid ID', () => {
    expect(getPreprocessor('nonexistent')).toBeUndefined();
    expect(getPreprocessor('')).toBeUndefined();
  });
});

describe('isValidApiPreprocessor', () => {
  it('returns true for API IDs', () => {
    expect(isValidApiPreprocessor('canny')).toBe(true);
    expect(isValidApiPreprocessor('lineart_anime')).toBe(true);
    expect(isValidApiPreprocessor('openpose')).toBe(true);
  });

  it('returns true for internal IDs that also serve as API IDs', () => {
    expect(isValidApiPreprocessor('depth')).toBe(true);
    expect(isValidApiPreprocessor('tile')).toBe(true);
  });

  it('returns false for invalid IDs', () => {
    expect(isValidApiPreprocessor('nonexistent')).toBe(false);
    expect(isValidApiPreprocessor('')).toBe(false);
  });
});
