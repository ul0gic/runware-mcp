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
  AUDIO_MODELS,
  TTS_VOICES,
  TTS_VOICE_INFO,
  getAudioModel,
  getAudioModelsByCapability,
  getAudioModelsByProvider,
  getAllAudioProviders,
  getDefaultAudioModel,
  getAudioModelsWithComposition,
  getAudioModelsByMinDuration,
  isValidAudioModel,
  isValidTTSVoice,
  getTTSVoiceInfo,
  getTTSVoicesByGender,
  getAllAudioModelIds,
  getAllTTSVoices,
} from '../../../src/constants/audio-models.js';

// ============================================================================
// AUDIO_MODELS catalog
// ============================================================================

describe('AUDIO_MODELS', () => {
  const allModels = Object.values(AUDIO_MODELS);
  const allKeys = Object.keys(AUDIO_MODELS);

  it('contains 4 audio models', () => {
    expect(allKeys.length).toBe(4);
  });

  it('every model has an id that matches its key', () => {
    for (const key of allKeys) {
      const model = AUDIO_MODELS[key as keyof typeof AUDIO_MODELS];
      expect(model.id).toBe(key);
    }
  });

  it('every model has required fields', () => {
    for (const model of allModels) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.capabilities).toBeInstanceOf(Array);
      expect(model.capabilities.length).toBeGreaterThan(0);
      expect(model.minDuration).toBeGreaterThan(0);
      expect(model.maxDuration).toBeGreaterThanOrEqual(model.minDuration);
      expect(typeof model.supportsComposition).toBe('boolean');
      expect(model.defaultSampleRate).toBeGreaterThan(0);
      expect(model.defaultBitrate).toBeGreaterThan(0);
    }
  });

  it('contains ElevenLabs models', () => {
    const elIds = allKeys.filter((k) => k.startsWith('elevenlabs:'));
    expect(elIds.length).toBe(2);
  });

  it('contains Mirelo models', () => {
    const mireloIds = allKeys.filter((k) => k.startsWith('mirelo:'));
    expect(mireloIds.length).toBe(2);
  });

  it('ElevenLabs models support composition', () => {
    expect(AUDIO_MODELS['elevenlabs:1@1'].supportsComposition).toBe(true);
    expect(AUDIO_MODELS['elevenlabs:1@2'].supportsComposition).toBe(true);
  });

  it('Mirelo models do not support composition', () => {
    expect(AUDIO_MODELS['mirelo:1@1'].supportsComposition).toBe(false);
    expect(AUDIO_MODELS['mirelo:1@2'].supportsComposition).toBe(false);
  });

  it('ElevenLabs HD model has higher sample rate and bitrate', () => {
    expect(AUDIO_MODELS['elevenlabs:1@2'].defaultSampleRate).toBe(48_000);
    expect(AUDIO_MODELS['elevenlabs:1@2'].defaultBitrate).toBe(320);
  });
});

// ============================================================================
// getAudioModel
// ============================================================================

describe('getAudioModel', () => {
  it('returns model for valid ID', () => {
    const model = getAudioModel('elevenlabs:1@1');
    expect(model).toBeDefined();
    expect(model?.name).toBe('ElevenLabs Music');
    expect(model?.provider).toBe('elevenlabs');
  });

  it('returns undefined for invalid ID', () => {
    expect(getAudioModel('nonexistent')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getAudioModel('')).toBeUndefined();
  });

  it('returns Mirelo model for valid ID', () => {
    const model = getAudioModel('mirelo:1@2');
    expect(model).toBeDefined();
    expect(model?.name).toBe('Mirelo Audio Pro');
    expect(model?.provider).toBe('mirelo');
  });
});

// ============================================================================
// getAudioModelsByCapability
// ============================================================================

describe('getAudioModelsByCapability', () => {
  it('finds models with music capability', () => {
    const models = getAudioModelsByCapability('music');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.capabilities).toContain('music');
    }
  });

  it('finds models with sfx capability', () => {
    const models = getAudioModelsByCapability('sfx');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.capabilities).toContain('sfx');
    }
  });

  it('finds models with speech capability', () => {
    const models = getAudioModelsByCapability('speech');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.capabilities).toContain('speech');
    }
  });

  it('finds models with ambient capability', () => {
    const models = getAudioModelsByCapability('ambient');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.capabilities).toContain('ambient');
    }
  });

  it('finds models with composition capability', () => {
    const models = getAudioModelsByCapability('composition');
    expect(models.length).toBe(2); // Only ElevenLabs models
    for (const model of models) {
      expect(model.capabilities).toContain('composition');
    }
  });
});

// ============================================================================
// getAudioModelsByProvider
// ============================================================================

describe('getAudioModelsByProvider', () => {
  it('returns ElevenLabs models', () => {
    const models = getAudioModelsByProvider('elevenlabs');
    expect(models.length).toBe(2);
    for (const model of models) {
      expect(model.provider).toBe('elevenlabs');
    }
  });

  it('returns Mirelo models', () => {
    const models = getAudioModelsByProvider('mirelo');
    expect(models.length).toBe(2);
    for (const model of models) {
      expect(model.provider).toBe('mirelo');
    }
  });
});

// ============================================================================
// getAllAudioProviders
// ============================================================================

describe('getAllAudioProviders', () => {
  it('returns both providers', () => {
    const providers = getAllAudioProviders();
    expect(providers).toContain('elevenlabs');
    expect(providers).toContain('mirelo');
    expect(providers.length).toBe(2);
  });
});

// ============================================================================
// getDefaultAudioModel
// ============================================================================

describe('getDefaultAudioModel', () => {
  it('returns ElevenLabs Music as default', () => {
    const model = getDefaultAudioModel();
    expect(model.id).toBe('elevenlabs:1@1');
    expect(model.name).toBe('ElevenLabs Music');
  });
});

// ============================================================================
// getAudioModelsWithComposition
// ============================================================================

describe('getAudioModelsWithComposition', () => {
  it('returns only ElevenLabs models', () => {
    const models = getAudioModelsWithComposition();
    expect(models.length).toBe(2);
    for (const model of models) {
      expect(model.supportsComposition).toBe(true);
      expect(model.provider).toBe('elevenlabs');
    }
  });
});

// ============================================================================
// getAudioModelsByMinDuration
// ============================================================================

describe('getAudioModelsByMinDuration', () => {
  it('returns models supporting at least 60 seconds', () => {
    const models = getAudioModelsByMinDuration(60);
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.maxDuration).toBeGreaterThanOrEqual(60);
    }
  });

  it('returns all models for 5 seconds', () => {
    const models = getAudioModelsByMinDuration(5);
    expect(models.length).toBe(4);
  });

  it('returns only ElevenLabs and Mirelo Pro for 120+ seconds', () => {
    const models = getAudioModelsByMinDuration(120);
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.maxDuration).toBeGreaterThanOrEqual(120);
    }
  });

  it('returns only ElevenLabs for 300 seconds', () => {
    const models = getAudioModelsByMinDuration(300);
    expect(models.length).toBe(2);
    for (const model of models) {
      expect(model.provider).toBe('elevenlabs');
    }
  });
});

// ============================================================================
// isValidAudioModel
// ============================================================================

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

// ============================================================================
// getAllAudioModelIds
// ============================================================================

describe('getAllAudioModelIds', () => {
  it('returns all 4 model IDs', () => {
    const ids = getAllAudioModelIds();
    expect(ids.length).toBe(4);
    expect(ids).toContain('elevenlabs:1@1');
    expect(ids).toContain('elevenlabs:1@2');
    expect(ids).toContain('mirelo:1@1');
    expect(ids).toContain('mirelo:1@2');
  });
});

// ============================================================================
// TTS_VOICES
// ============================================================================

describe('TTS_VOICES', () => {
  it('contains 14 voices', () => {
    expect(TTS_VOICES.length).toBe(14);
  });

  it('contains OpenAI-style voices', () => {
    expect(TTS_VOICES).toContain('alloy');
    expect(TTS_VOICES).toContain('echo');
    expect(TTS_VOICES).toContain('fable');
    expect(TTS_VOICES).toContain('onyx');
    expect(TTS_VOICES).toContain('nova');
    expect(TTS_VOICES).toContain('shimmer');
  });

  it('contains character voices', () => {
    expect(TTS_VOICES).toContain('adam');
    expect(TTS_VOICES).toContain('bella');
    expect(TTS_VOICES).toContain('chris');
    expect(TTS_VOICES).toContain('dorothy');
    expect(TTS_VOICES).toContain('emily');
    expect(TTS_VOICES).toContain('freya');
    expect(TTS_VOICES).toContain('george');
    expect(TTS_VOICES).toContain('harry');
  });
});

// ============================================================================
// TTS_VOICE_INFO
// ============================================================================

describe('TTS_VOICE_INFO', () => {
  it('has info for every voice in TTS_VOICES', () => {
    for (const voice of TTS_VOICES) {
      const info = TTS_VOICE_INFO[voice];
      expect(info).toBeDefined();
      expect(info.id).toBe(voice);
      expect(info.name).toBeTruthy();
      expect(['male', 'female', 'neutral']).toContain(info.gender);
      expect(info.style).toBeTruthy();
      expect(info.bestFor).toBeInstanceOf(Array);
      expect(info.bestFor.length).toBeGreaterThan(0);
    }
  });

  it('alloy is neutral gender', () => {
    expect(TTS_VOICE_INFO.alloy.gender).toBe('neutral');
  });

  it('echo is male', () => {
    expect(TTS_VOICE_INFO.echo.gender).toBe('male');
  });

  it('nova is female', () => {
    expect(TTS_VOICE_INFO.nova.gender).toBe('female');
  });
});

// ============================================================================
// isValidTTSVoice
// ============================================================================

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

// ============================================================================
// getTTSVoiceInfo
// ============================================================================

describe('getTTSVoiceInfo', () => {
  it('returns info for alloy', () => {
    const info = getTTSVoiceInfo('alloy');
    expect(info.id).toBe('alloy');
    expect(info.name).toBe('Alloy');
    expect(info.gender).toBe('neutral');
  });

  it('returns info for harry', () => {
    const info = getTTSVoiceInfo('harry');
    expect(info.id).toBe('harry');
    expect(info.gender).toBe('male');
  });
});

// ============================================================================
// getTTSVoicesByGender
// ============================================================================

describe('getTTSVoicesByGender', () => {
  it('returns male voices', () => {
    const males = getTTSVoicesByGender('male');
    expect(males.length).toBeGreaterThan(0);
    for (const voice of males) {
      expect(TTS_VOICE_INFO[voice].gender).toBe('male');
    }
  });

  it('returns female voices', () => {
    const females = getTTSVoicesByGender('female');
    expect(females.length).toBeGreaterThan(0);
    for (const voice of females) {
      expect(TTS_VOICE_INFO[voice].gender).toBe('female');
    }
  });

  it('returns neutral voices', () => {
    const neutrals = getTTSVoicesByGender('neutral');
    expect(neutrals.length).toBeGreaterThan(0);
    for (const voice of neutrals) {
      expect(TTS_VOICE_INFO[voice].gender).toBe('neutral');
    }
  });

  it('all genders sum to total voice count', () => {
    const males = getTTSVoicesByGender('male');
    const females = getTTSVoicesByGender('female');
    const neutrals = getTTSVoicesByGender('neutral');
    expect(males.length + females.length + neutrals.length).toBe(TTS_VOICES.length);
  });
});

// ============================================================================
// getAllTTSVoices
// ============================================================================

describe('getAllTTSVoices', () => {
  it('returns all 14 voices', () => {
    const voices = getAllTTSVoices();
    expect(voices.length).toBe(14);
  });

  it('returns a copy (not the original array)', () => {
    const voices = getAllTTSVoices();
    expect(voices).toEqual([...TTS_VOICES]);
    expect(voices).not.toBe(TTS_VOICES);
  });
});
