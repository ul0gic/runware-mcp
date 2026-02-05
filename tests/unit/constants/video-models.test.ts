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
  VIDEO_MODELS,
  getVideoModel,
  getVideoModelsByProvider,
  getAllVideoProviders,
  getDefaultVideoModel,
  getVideoModelsByFeature,
  getVideoModelsWithAudio,
  getVideoModelsByMinDuration,
  getVideoModelsByResolution,
  isValidVideoModel,
  getAllVideoModelIds,
} from '../../../src/constants/video-models.js';

import type { VideoModel } from '../../../src/constants/video-models.js';

// ============================================================================
// VIDEO_MODELS catalog
// ============================================================================

describe('VIDEO_MODELS', () => {
  const allModels = Object.values(VIDEO_MODELS);
  const allKeys = Object.keys(VIDEO_MODELS);

  it('contains 31 video models', () => {
    expect(allKeys.length).toBe(31);
  });

  it('every model has an id that matches its key', () => {
    for (const key of allKeys) {
      const model = VIDEO_MODELS[key as keyof typeof VIDEO_MODELS];
      expect(model.id).toBe(key);
    }
  });

  it('every model has required fields', () => {
    for (const model of allModels) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.maxWidth).toBeGreaterThan(0);
      expect(model.maxHeight).toBeGreaterThan(0);
      expect(model.minDuration).toBeGreaterThan(0);
      expect(model.maxDuration).toBeGreaterThanOrEqual(model.minDuration);
      expect(typeof model.supportsFPS).toBe('boolean');
      expect(typeof model.supportsAudio).toBe('boolean');
      expect(typeof model.supportsImageInput).toBe('boolean');
      expect(typeof model.supportsVideoInput).toBe('boolean');
      expect(model.features).toBeInstanceOf(Array);
      expect(model.features.length).toBeGreaterThan(0);
    }
  });

  it('contains expected KlingAI models', () => {
    const klingIds = allKeys.filter((k) => k.startsWith('klingai:'));
    expect(klingIds.length).toBe(10);
  });

  it('contains expected Google Veo models', () => {
    const veoIds = allKeys.filter((k) => k.startsWith('veo:'));
    expect(veoIds.length).toBe(3);
  });

  it('contains expected MiniMax models', () => {
    const minimaxIds = allKeys.filter((k) => k.startsWith('minimax:'));
    expect(minimaxIds.length).toBe(4);
  });

  it('contains expected PixVerse models', () => {
    const pixverseIds = allKeys.filter((k) => k.startsWith('pixverse:'));
    expect(pixverseIds.length).toBe(3);
  });

  it('contains expected Vidu models', () => {
    const viduIds = allKeys.filter((k) => k.startsWith('vidu:'));
    expect(viduIds.length).toBe(4);
  });

  it('contains expected Wan/Alibaba models', () => {
    const wanIds = allKeys.filter((k) => k.startsWith('wan:'));
    expect(wanIds.length).toBe(2);
  });

  it('contains expected Runway models', () => {
    const runwayIds = allKeys.filter((k) => k.startsWith('runway:'));
    expect(runwayIds.length).toBe(2);
  });

  it('contains expected Seedance models', () => {
    const seedanceIds = allKeys.filter((k) => k.startsWith('seedance:'));
    expect(seedanceIds.length).toBe(2);
  });

  it('contains expected Sync model', () => {
    const syncIds = allKeys.filter((k) => k.startsWith('sync:'));
    expect(syncIds.length).toBe(1);
  });
});

// ============================================================================
// getVideoModel
// ============================================================================

describe('getVideoModel', () => {
  it('returns model for valid ID', () => {
    const model = getVideoModel('klingai:1@1');
    expect(model).toBeDefined();
    expect(model?.name).toBe('Kling 1.0 Standard');
    expect(model?.provider).toBe('klingai');
  });

  it('returns undefined for invalid ID', () => {
    expect(getVideoModel('nonexistent:model')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getVideoModel('')).toBeUndefined();
  });

  it('returns correct data for Veo 3', () => {
    const model = getVideoModel('veo:3@1');
    expect(model).toBeDefined();
    expect(model?.provider).toBe('google');
    expect(model?.supportsAudio).toBe(true);
  });

  it('returns correct data for Sync lipsync model', () => {
    const model = getVideoModel('sync:1.9.1@1');
    expect(model).toBeDefined();
    expect(model?.provider).toBe('sync');
    expect(model?.maxDuration).toBe(60);
    expect(model?.features).toContain('lip-sync');
  });
});

// ============================================================================
// getVideoModelsByProvider
// ============================================================================

describe('getVideoModelsByProvider', () => {
  it('returns all KlingAI models', () => {
    const models = getVideoModelsByProvider('klingai');
    expect(models.length).toBe(10);
    for (const model of models) {
      expect(model.provider).toBe('klingai');
    }
  });

  it('returns all Google models', () => {
    const models = getVideoModelsByProvider('google');
    expect(models.length).toBe(3);
  });

  it('returns empty array for provider with no models in the literal sense is impossible since all providers are defined', () => {
    // All defined providers have models; test filtering logic
    const models = getVideoModelsByProvider('sync');
    expect(models.length).toBe(1);
  });
});

// ============================================================================
// getAllVideoProviders
// ============================================================================

describe('getAllVideoProviders', () => {
  it('returns all unique providers', () => {
    const providers = getAllVideoProviders();
    expect(providers).toContain('klingai');
    expect(providers).toContain('google');
    expect(providers).toContain('minimax');
    expect(providers).toContain('pixverse');
    expect(providers).toContain('vidu');
    expect(providers).toContain('alibaba');
    expect(providers).toContain('runway');
    expect(providers).toContain('seedance');
    expect(providers).toContain('sync');
  });

  it('returns 9 unique providers', () => {
    const providers = getAllVideoProviders();
    expect(providers.length).toBe(9);
  });
});

// ============================================================================
// getDefaultVideoModel
// ============================================================================

describe('getDefaultVideoModel', () => {
  it('returns Kling 1.5 Pro as default', () => {
    const model = getDefaultVideoModel();
    expect(model.id).toBe('klingai:1.5@2');
    expect(model.name).toBe('Kling 1.5 Pro');
  });

  it('default model supports audio', () => {
    const model = getDefaultVideoModel();
    expect(model.supportsAudio).toBe(true);
  });
});

// ============================================================================
// getVideoModelsByFeature
// ============================================================================

describe('getVideoModelsByFeature', () => {
  it('finds models with text-to-video', () => {
    const models = getVideoModelsByFeature('text-to-video');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.features).toContain('text-to-video');
    }
  });

  it('finds models with native-audio', () => {
    const models = getVideoModelsByFeature('native-audio');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.features).toContain('native-audio');
    }
  });

  it('finds models with 1080p', () => {
    const models = getVideoModelsByFeature('1080p');
    expect(models.length).toBeGreaterThan(0);
  });

  it('finds models with lip-sync', () => {
    const models = getVideoModelsByFeature('lip-sync');
    expect(models.length).toBe(1);
    expect(models[0]?.id).toBe('sync:1.9.1@1');
  });

  it('returns empty array for non-existent feature', () => {
    const models = getVideoModelsByFeature('nonexistent-feature');
    expect(models).toEqual([]);
  });
});

// ============================================================================
// getVideoModelsWithAudio
// ============================================================================

describe('getVideoModelsWithAudio', () => {
  it('returns only models that support audio', () => {
    const models = getVideoModelsWithAudio();
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.supportsAudio).toBe(true);
    }
  });

  it('includes Veo 3 which supports audio', () => {
    const models = getVideoModelsWithAudio();
    const veo3 = models.find((m) => m.id === 'veo:3@1');
    expect(veo3).toBeDefined();
  });
});

// ============================================================================
// getVideoModelsByMinDuration
// ============================================================================

describe('getVideoModelsByMinDuration', () => {
  it('returns models supporting at least 10 seconds', () => {
    const models = getVideoModelsByMinDuration(10);
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.maxDuration).toBeGreaterThanOrEqual(10);
    }
  });

  it('includes Sync model for 60 second requirement', () => {
    const models = getVideoModelsByMinDuration(60);
    const sync = models.find((m) => m.id === 'sync:1.9.1@1');
    expect(sync).toBeDefined();
  });

  it('returns all models for 1 second requirement', () => {
    const models = getVideoModelsByMinDuration(1);
    expect(models.length).toBe(Object.keys(VIDEO_MODELS).length);
  });

  it('returns only long-duration models for 30 seconds', () => {
    const models = getVideoModelsByMinDuration(30);
    for (const model of models) {
      expect(model.maxDuration).toBeGreaterThanOrEqual(30);
    }
  });
});

// ============================================================================
// getVideoModelsByResolution
// ============================================================================

describe('getVideoModelsByResolution', () => {
  it('returns models supporting 1920x1080', () => {
    const models = getVideoModelsByResolution(1920, 1080);
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.maxWidth).toBeGreaterThanOrEqual(1920);
      expect(model.maxHeight).toBeGreaterThanOrEqual(1080);
    }
  });

  it('returns all models for small resolution', () => {
    const models = getVideoModelsByResolution(640, 480);
    expect(models.length).toBe(Object.keys(VIDEO_MODELS).length);
  });

  it('returns fewer models for very high resolution', () => {
    const models = getVideoModelsByResolution(3840, 2160);
    expect(models.length).toBe(0);
  });
});

// ============================================================================
// isValidVideoModel
// ============================================================================

describe('isValidVideoModel', () => {
  it('returns true for valid model ID', () => {
    expect(isValidVideoModel('klingai:1@1')).toBe(true);
    expect(isValidVideoModel('veo:3@1')).toBe(true);
    expect(isValidVideoModel('sync:1.9.1@1')).toBe(true);
  });

  it('returns false for invalid model ID', () => {
    expect(isValidVideoModel('invalid')).toBe(false);
    expect(isValidVideoModel('')).toBe(false);
    expect(isValidVideoModel('klingai:999@999')).toBe(false);
  });
});

// ============================================================================
// getAllVideoModelIds
// ============================================================================

describe('getAllVideoModelIds', () => {
  it('returns all model IDs', () => {
    const ids = getAllVideoModelIds();
    expect(ids.length).toBe(31);
  });

  it('includes known model IDs', () => {
    const ids = getAllVideoModelIds();
    expect(ids).toContain('klingai:1@1');
    expect(ids).toContain('veo:3@1');
    expect(ids).toContain('sync:1.9.1@1');
  });
});
