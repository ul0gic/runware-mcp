// Does:  Audio model and TTS voice guards accept catalogued ids and reject unknown ones.
// Holds: config is mocked; the real audio-models catalog is read.

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

import { isValidAudioModel, isValidTTSVoice } from '../../../src/constants/audio-models.js';

describe('isValidAudioModel', () => {
  it('returns true for valid model IDs', () => {
    expect(isValidAudioModel('elevenlabs:1@1')).toBe(true);
    expect(isValidAudioModel('elevenlabs:1@2')).toBe(true);
    expect(isValidAudioModel('mirelo:1@1')).toBe(true);
    expect(isValidAudioModel('mirelo:1@2')).toBe(true);
  });

  it('returns false for invalid model IDs', () => {
    expect(isValidAudioModel('invalid')).toBe(false);
    expect(isValidAudioModel('')).toBe(false);
    expect(isValidAudioModel('elevenlabs:999@999')).toBe(false);
  });
});

describe('isValidTTSVoice', () => {
  it('returns true for valid voices', () => {
    expect(isValidTTSVoice('alloy')).toBe(true);
    expect(isValidTTSVoice('harry')).toBe(true);
  });

  it('returns false for invalid voices', () => {
    expect(isValidTTSVoice('invalid')).toBe(false);
    expect(isValidTTSVoice('')).toBe(false);
  });
});
