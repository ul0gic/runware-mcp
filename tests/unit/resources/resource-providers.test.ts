import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks — must be declared before imports
// ============================================================================

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

// ============================================================================
// Imports
// ============================================================================

import {
  generatedImagesProvider,
  registerImage,
  clearSessionImages,
  getSessionImages,
} from '../../../src/resources/generated-images/provider.js';

import {
  generatedVideosProvider,
  registerVideo,
  clearSessionVideos,
  getSessionVideos,
} from '../../../src/resources/generated-videos/provider.js';

import {
  generatedAudioProvider,
  registerAudio,
  clearSessionAudio,
  getSessionAudio,
} from '../../../src/resources/generated-audio/provider.js';

import {
  sessionHistoryProvider,
  recordSessionEvent,
  clearSessionEvents,
} from '../../../src/resources/session-history/provider.js';

import { analyticsProvider } from '../../../src/resources/analytics/provider.js';
import { documentationProvider } from '../../../src/resources/documentation/provider.js';

import {
  RESOURCE_PROVIDERS,
  findProviderForUri,
} from '../../../src/resources/index.js';

import type { GeneratedImageEntry } from '../../../src/resources/generated-images/types.js';
import type { GeneratedVideoEntry } from '../../../src/resources/generated-videos/types.js';
import type { GeneratedAudioEntry } from '../../../src/resources/generated-audio/types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeImageEntry(overrides?: Partial<GeneratedImageEntry>): GeneratedImageEntry {
  return {
    id: 'img-001',
    imageUUID: 'uuid-img-001',
    imageURL: 'https://cdn.runware.ai/img-001.png',
    prompt: 'A beautiful sunset over the ocean',
    model: 'civitai:943001@1055701',
    width: 1024,
    height: 1024,
    cost: 0.05,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    ...overrides,
  };
}

function makeVideoEntry(overrides?: Partial<GeneratedVideoEntry>): GeneratedVideoEntry {
  return {
    id: 'vid-001',
    videoUUID: 'uuid-vid-001',
    videoURL: 'https://cdn.runware.ai/vid-001.mp4',
    prompt: 'A cinematic drone shot of a forest',
    model: 'klingai:2@1',
    duration: 5,
    width: 1280,
    height: 720,
    cost: 0.40,
    createdAt: new Date('2025-01-15T11:00:00Z'),
    ...overrides,
  };
}

function makeAudioEntry(overrides?: Partial<GeneratedAudioEntry>): GeneratedAudioEntry {
  return {
    id: 'aud-001',
    audioUUID: 'uuid-aud-001',
    audioURL: 'https://cdn.runware.ai/aud-001.mp3',
    prompt: 'Calm ambient music for relaxation',
    model: 'elevenlabs:1@1',
    duration: 30,
    audioType: 'music',
    cost: 0.30,
    createdAt: new Date('2025-01-15T12:00:00Z'),
    ...overrides,
  };
}

// ============================================================================
// Generated Images Provider
// ============================================================================

describe('generatedImagesProvider', () => {
  beforeEach(() => {
    clearSessionImages();
  });

  describe('metadata', () => {
    it('has correct URI pattern', () => {
      expect(generatedImagesProvider.uri).toBe('runware://images/{id}');
    });

    it('has correct name', () => {
      expect(generatedImagesProvider.name).toBe('Generated Images');
    });

    it('has a description', () => {
      expect(generatedImagesProvider.description).toBeTruthy();
    });

    it('has application/json mimeType', () => {
      expect(generatedImagesProvider.mimeType).toBe('application/json');
    });
  });

  describe('session store', () => {
    it('registerImage adds to session store', () => {
      const entry = makeImageEntry();
      registerImage(entry);
      const images = getSessionImages();
      expect(images).toHaveLength(1);
      expect(images[0]?.id).toBe('img-001');
    });

    it('clearSessionImages empties the store', () => {
      registerImage(makeImageEntry());
      expect(getSessionImages()).toHaveLength(1);
      clearSessionImages();
      expect(getSessionImages()).toHaveLength(0);
    });

    it('overwrites entry with same id', () => {
      registerImage(makeImageEntry({ prompt: 'first' }));
      registerImage(makeImageEntry({ prompt: 'second' }));
      const images = getSessionImages();
      expect(images).toHaveLength(1);
      expect(images[0]?.prompt).toBe('second');
    });
  });

  describe('list()', () => {
    it('returns empty array when no images exist', async () => {
      const entries = await generatedImagesProvider.list();
      expect(entries).toEqual([]);
    });

    it('returns session images', async () => {
      registerImage(makeImageEntry());
      const entries = await generatedImagesProvider.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.uri).toBe('runware://images/img-001');
      expect(entries[0]?.mimeType).toBe('application/json');
    });

    it('uses truncated prompt as name when prompt is non-empty', async () => {
      registerImage(makeImageEntry({ prompt: 'A short prompt' }));
      const entries = await generatedImagesProvider.list();
      expect(entries[0]?.name).toBe('A short prompt');
    });

    it('uses fallback name when prompt is empty', async () => {
      registerImage(makeImageEntry({ prompt: '' }));
      const entries = await generatedImagesProvider.list();
      expect(entries[0]?.name).toBe('Image img-001');
    });

    it('includes dimension and model in description', async () => {
      registerImage(makeImageEntry());
      const entries = await generatedImagesProvider.list();
      expect(entries[0]?.description).toContain('1024x1024');
      expect(entries[0]?.description).toContain('civitai:943001@1055701');
    });

  });

  describe('get()', () => {
    it('returns session image by URI', async () => {
      const entry = makeImageEntry();
      registerImage(entry);
      const result = await generatedImagesProvider.get('runware://images/img-001');
      expect(result).not.toBeNull();
      expect(result?.uri).toBe('runware://images/img-001');
      expect(result?.mimeType).toBe('application/json');
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.id).toBe('img-001');
    });

    it('returns null for non-existent image', async () => {
      const result = await generatedImagesProvider.get('runware://images/non-existent');
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Generated Videos Provider
// ============================================================================

describe('generatedVideosProvider', () => {
  beforeEach(() => {
    clearSessionVideos();
  });

  describe('metadata', () => {
    it('has correct URI pattern', () => {
      expect(generatedVideosProvider.uri).toBe('runware://videos/{id}');
    });

    it('has correct name', () => {
      expect(generatedVideosProvider.name).toBe('Generated Videos');
    });

    it('has a description', () => {
      expect(generatedVideosProvider.description).toBeTruthy();
    });

    it('has application/json mimeType', () => {
      expect(generatedVideosProvider.mimeType).toBe('application/json');
    });
  });

  describe('session store', () => {
    it('registerVideo adds to session store', () => {
      registerVideo(makeVideoEntry());
      expect(getSessionVideos()).toHaveLength(1);
    });

    it('clearSessionVideos empties the store', () => {
      registerVideo(makeVideoEntry());
      clearSessionVideos();
      expect(getSessionVideos()).toHaveLength(0);
    });
  });

  describe('list()', () => {
    it('returns empty array when no videos exist', async () => {
      const entries = await generatedVideosProvider.list();
      expect(entries).toEqual([]);
    });

    it('returns session videos with correct URI', async () => {
      registerVideo(makeVideoEntry());
      const entries = await generatedVideosProvider.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.uri).toBe('runware://videos/vid-001');
    });

    it('includes duration, dimensions, and model in description', async () => {
      registerVideo(makeVideoEntry());
      const entries = await generatedVideosProvider.list();
      expect(entries[0]?.description).toContain('5s');
      expect(entries[0]?.description).toContain('1280x720');
      expect(entries[0]?.description).toContain('klingai:2@1');
    });

    it('uses fallback name when prompt is empty', async () => {
      registerVideo(makeVideoEntry({ prompt: '' }));
      const entries = await generatedVideosProvider.list();
      expect(entries[0]?.name).toBe('Video vid-001');
    });

  });

  describe('get()', () => {
    it('returns session video by URI', async () => {
      registerVideo(makeVideoEntry());
      const result = await generatedVideosProvider.get('runware://videos/vid-001');
      expect(result).not.toBeNull();
      expect(result?.uri).toBe('runware://videos/vid-001');
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.id).toBe('vid-001');
    });

    it('returns null for non-existent video', async () => {
      const result = await generatedVideosProvider.get('runware://videos/non-existent');
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Generated Audio Provider
// ============================================================================

describe('generatedAudioProvider', () => {
  beforeEach(() => {
    clearSessionAudio();
  });

  describe('metadata', () => {
    it('has correct URI pattern', () => {
      expect(generatedAudioProvider.uri).toBe('runware://audio/{id}');
    });

    it('has correct name', () => {
      expect(generatedAudioProvider.name).toBe('Generated Audio');
    });

    it('has a description', () => {
      expect(generatedAudioProvider.description).toBeTruthy();
    });

    it('has application/json mimeType', () => {
      expect(generatedAudioProvider.mimeType).toBe('application/json');
    });
  });

  describe('session store', () => {
    it('registerAudio adds to session store', () => {
      registerAudio(makeAudioEntry());
      expect(getSessionAudio()).toHaveLength(1);
    });

    it('clearSessionAudio empties the store', () => {
      registerAudio(makeAudioEntry());
      clearSessionAudio();
      expect(getSessionAudio()).toHaveLength(0);
    });
  });

  describe('list()', () => {
    it('returns empty array when no audio exists', async () => {
      const entries = await generatedAudioProvider.list();
      expect(entries).toEqual([]);
    });

    it('returns session audio with correct URI', async () => {
      registerAudio(makeAudioEntry());
      const entries = await generatedAudioProvider.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.uri).toBe('runware://audio/aud-001');
    });

    it('includes duration, audioType, and model in description', async () => {
      registerAudio(makeAudioEntry());
      const entries = await generatedAudioProvider.list();
      expect(entries[0]?.description).toContain('30s');
      expect(entries[0]?.description).toContain('music');
      expect(entries[0]?.description).toContain('elevenlabs:1@1');
    });

    it('uses fallback name when prompt is empty', async () => {
      registerAudio(makeAudioEntry({ prompt: '' }));
      const entries = await generatedAudioProvider.list();
      expect(entries[0]?.name).toBe('Audio aud-001');
    });

  });

  describe('get()', () => {
    it('returns session audio by URI', async () => {
      registerAudio(makeAudioEntry());
      const result = await generatedAudioProvider.get('runware://audio/aud-001');
      expect(result).not.toBeNull();
      expect(result?.uri).toBe('runware://audio/aud-001');
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.id).toBe('aud-001');
    });

    it('returns null for non-existent audio', async () => {
      const result = await generatedAudioProvider.get('runware://audio/non-existent');
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Session History Provider
// ============================================================================

describe('sessionHistoryProvider', () => {
  beforeEach(() => {
    clearSessionImages();
    clearSessionVideos();
    clearSessionAudio();
    clearSessionEvents();
  });

  describe('metadata', () => {
    it('has correct URI', () => {
      expect(sessionHistoryProvider.uri).toBe('runware://session/history');
    });

    it('has correct name', () => {
      expect(sessionHistoryProvider.name).toBe('Session History');
    });

    it('has application/json mimeType', () => {
      expect(sessionHistoryProvider.mimeType).toBe('application/json');
    });
  });

  describe('list()', () => {
    it('returns a single entry', async () => {
      const entries = await sessionHistoryProvider.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.uri).toBe('runware://session/history');
      expect(entries[0]?.name).toBe('Session History');
    });

    it('includes generation count in description', async () => {
      registerImage(makeImageEntry());
      registerVideo(makeVideoEntry());
      const entries = await sessionHistoryProvider.list();
      expect(entries[0]?.description).toContain('2');
    });
  });

  describe('get()', () => {
    it('returns null for non-matching URI', async () => {
      const result = await sessionHistoryProvider.get('runware://session/other');
      expect(result).toBeNull();
    });

    it('returns session history JSON for correct URI', async () => {
      registerImage(makeImageEntry());
      const result = await sessionHistoryProvider.get('runware://session/history');
      expect(result).not.toBeNull();
      expect(result?.uri).toBe('runware://session/history');
      expect(result?.mimeType).toBe('application/json');
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.totalGenerations).toBeGreaterThanOrEqual(1);
      expect(parsed.entries).toBeInstanceOf(Array);
      expect(parsed.startedAt).toBeDefined();
    });

    it('aggregates images, videos, and audio in history', async () => {
      registerImage(makeImageEntry({ cost: 0.05 }));
      registerVideo(makeVideoEntry({ cost: 0.40 }));
      registerAudio(makeAudioEntry({ cost: 0.30 }));
      const result = await sessionHistoryProvider.get('runware://session/history');
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.totalGenerations).toBe(3);
      expect(parsed.totalCost).toBeCloseTo(0.75, 2);
    });

    it('includes additional session events', async () => {
      recordSessionEvent({
        id: 'evt-001',
        taskType: 'imageUpscale',
        prompt: undefined,
        model: undefined,
        outputURL: 'https://example.com/upscaled.png',
        cost: 0.01,
        createdAt: new Date('2025-01-15T13:00:00Z'),
      });
      const result = await sessionHistoryProvider.get('runware://session/history');
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.totalGenerations).toBe(1);
      expect(parsed.entries[0].taskType).toBe('imageUpscale');
    });

    it('sorts entries by createdAt descending', async () => {
      registerImage(makeImageEntry({ id: 'img-old', createdAt: new Date('2025-01-01T00:00:00Z') }));
      registerImage(makeImageEntry({ id: 'img-new', createdAt: new Date('2025-01-20T00:00:00Z') }));
      const result = await sessionHistoryProvider.get('runware://session/history');
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.entries[0].id).toBe('img-new');
      expect(parsed.entries[1].id).toBe('img-old');
    });
  });
});

// ============================================================================
// Analytics Provider
// ============================================================================

describe('analyticsProvider', () => {
  beforeEach(() => {
    clearSessionImages();
    clearSessionVideos();
    clearSessionAudio();
  });

  describe('metadata', () => {
    it('has correct URI pattern', () => {
      expect(analyticsProvider.uri).toBe('runware://analytics/{period}');
    });

    it('has correct name', () => {
      expect(analyticsProvider.name).toBe('Usage Analytics');
    });

    it('has application/json mimeType', () => {
      expect(analyticsProvider.mimeType).toBe('application/json');
    });
  });

  describe('list()', () => {
    it('returns 4 entries for day, week, month, all', async () => {
      const entries = await analyticsProvider.list();
      expect(entries).toHaveLength(4);
      const uris = entries.map((e) => e.uri);
      expect(uris).toContain('runware://analytics/day');
      expect(uris).toContain('runware://analytics/week');
      expect(uris).toContain('runware://analytics/month');
      expect(uris).toContain('runware://analytics/all');
    });

    it('entries have descriptive names', async () => {
      const entries = await analyticsProvider.list();
      const names = entries.map((e) => e.name);
      expect(names).toContain("Today's Analytics");
      expect(names).toContain("This Week's Analytics");
      expect(names).toContain("This Month's Analytics");
      expect(names).toContain('All-Time Analytics');
    });

    it('entries have mimeType', async () => {
      const entries = await analyticsProvider.list();
      for (const entry of entries) {
        expect(entry.mimeType).toBe('application/json');
      }
    });
  });

  describe('get()', () => {
    it('returns null for invalid period', async () => {
      const result = await analyticsProvider.get('runware://analytics/invalid');
      expect(result).toBeNull();
    });

    it('returns analytics data for valid period (day)', async () => {
      const result = await analyticsProvider.get('runware://analytics/day');
      expect(result).not.toBeNull();
      expect(result?.mimeType).toBe('application/json');
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.period).toBe('day');
      expect(parsed.totalGenerations).toBeDefined();
      expect(parsed.totalCost).toBeDefined();
    });

    it('returns analytics data for valid period (week)', async () => {
      const result = await analyticsProvider.get('runware://analytics/week');
      expect(result).not.toBeNull();
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.period).toBe('week');
    });

    it('returns analytics data for valid period (month)', async () => {
      const result = await analyticsProvider.get('runware://analytics/month');
      expect(result).not.toBeNull();
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.period).toBe('month');
    });

    it('returns analytics data for valid period (all)', async () => {
      const result = await analyticsProvider.get('runware://analytics/all');
      expect(result).not.toBeNull();
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.period).toBe('all');
    });

    it('computes session analytics with images, videos, audio', async () => {
      registerImage(makeImageEntry({ model: 'civitai:943001@1055701', cost: 0.05 }));
      registerVideo(makeVideoEntry({ model: 'klingai:2@1', cost: 0.40 }));
      registerAudio(makeAudioEntry({ model: 'elevenlabs:1@1', cost: 0.30 }));

      const result = await analyticsProvider.get('runware://analytics/all');
      const parsed = JSON.parse(result?.text ?? '{}');
      expect(parsed.totalGenerations).toBe(3);
      expect(parsed.totalCost).toBeCloseTo(0.75, 2);
      expect(parsed.byTaskType).toBeInstanceOf(Array);
      expect(parsed.byTaskType.length).toBe(3);
      expect(parsed.byProvider).toBeInstanceOf(Array);
      expect(parsed.topModels).toBeInstanceOf(Array);
    });
  });
});

// ============================================================================
// Resource Registry
// ============================================================================

describe('RESOURCE_PROVIDERS', () => {
  it('contains all 6 providers', () => {
    expect(RESOURCE_PROVIDERS).toHaveLength(6);
  });

  it('contains the images provider', () => {
    expect(RESOURCE_PROVIDERS).toContain(generatedImagesProvider);
  });

  it('contains the videos provider', () => {
    expect(RESOURCE_PROVIDERS).toContain(generatedVideosProvider);
  });

  it('contains the audio provider', () => {
    expect(RESOURCE_PROVIDERS).toContain(generatedAudioProvider);
  });

  it('contains the session history provider', () => {
    expect(RESOURCE_PROVIDERS).toContain(sessionHistoryProvider);
  });

  it('contains the analytics provider', () => {
    expect(RESOURCE_PROVIDERS).toContain(analyticsProvider);
  });

  it('contains the documentation provider', () => {
    expect(RESOURCE_PROVIDERS).toContain(documentationProvider);
  });
});

describe('findProviderForUri', () => {
  it('finds image provider for image URI', () => {
    expect(findProviderForUri('runware://images/some-id')).toBe(generatedImagesProvider);
  });

  it('finds video provider for video URI', () => {
    expect(findProviderForUri('runware://videos/some-id')).toBe(generatedVideosProvider);
  });

  it('finds audio provider for audio URI', () => {
    expect(findProviderForUri('runware://audio/some-id')).toBe(generatedAudioProvider);
  });

  it('finds session history provider for session URI', () => {
    expect(findProviderForUri('runware://session/history')).toBe(sessionHistoryProvider);
  });

  it('finds analytics provider for analytics URI', () => {
    expect(findProviderForUri('runware://analytics/day')).toBe(analyticsProvider);
  });

  it('finds documentation provider for docs URI', () => {
    expect(findProviderForUri('runware://docs/concepts/air-identifiers')).toBe(documentationProvider);
  });

  it('returns undefined for unknown URI', () => {
    expect(findProviderForUri('runware://unknown/thing')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(findProviderForUri('')).toBeUndefined();
  });
});
