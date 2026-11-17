// Does:  Proves resource providers list, resolve, aggregate and route session media URIs correctly.
// Holds: Providers and their in-memory session stores are real; only config is mocked (it validates env at import).
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
} from '../../../src/resources/generated-videos/provider.js';

import {
  generatedAudioProvider,
  registerAudio,
  clearSessionAudio,
} from '../../../src/resources/generated-audio/provider.js';

import {
  sessionHistoryProvider,
  recordSessionEvent,
  clearSessionEvents,
} from '../../../src/resources/session-history/provider.js';

import { analyticsProvider } from '../../../src/resources/analytics/provider.js';
import { documentationProvider } from '../../../src/resources/documentation/provider.js';

import { findProviderForUri } from '../../../src/resources/index.js';

import type { GeneratedImageEntry } from '../../../src/resources/generated-images/types.js';
import type { GeneratedVideoEntry } from '../../../src/resources/generated-videos/types.js';
import type { GeneratedAudioEntry } from '../../../src/resources/generated-audio/types.js';

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
    cost: 0.4,
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
    cost: 0.3,
    createdAt: new Date('2025-01-15T12:00:00Z'),
    ...overrides,
  };
}

describe('generatedImagesProvider', () => {
  beforeEach(() => {
    clearSessionImages();
  });

  describe('session store', () => {
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

describe('generatedVideosProvider', () => {
  beforeEach(() => {
    clearSessionVideos();
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

describe('generatedAudioProvider', () => {
  beforeEach(() => {
    clearSessionAudio();
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

describe('sessionHistoryProvider', () => {
  beforeEach(() => {
    clearSessionImages();
    clearSessionVideos();
    clearSessionAudio();
    clearSessionEvents();
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
      registerVideo(makeVideoEntry({ cost: 0.4 }));
      registerAudio(makeAudioEntry({ cost: 0.3 }));
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

describe('analyticsProvider', () => {
  beforeEach(() => {
    clearSessionImages();
    clearSessionVideos();
    clearSessionAudio();
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

    it('computes session analytics with images, videos, audio', async () => {
      registerImage(makeImageEntry({ model: 'civitai:943001@1055701', cost: 0.05 }));
      registerVideo(makeVideoEntry({ model: 'klingai:2@1', cost: 0.4 }));
      registerAudio(makeAudioEntry({ model: 'elevenlabs:1@1', cost: 0.3 }));

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

describe('findProviderForUri', () => {
  it.each([
    ['runware://images/some-id', generatedImagesProvider],
    ['runware://videos/some-id', generatedVideosProvider],
    ['runware://audio/some-id', generatedAudioProvider],
    ['runware://session/history', sessionHistoryProvider],
    ['runware://analytics/day', analyticsProvider],
    ['runware://docs/concepts/air-identifiers', documentationProvider],
  ])('routes %s to its provider', (uri, provider) => {
    expect(findProviderForUri(uri)).toBe(provider);
  });

  it.each(['runware://unknown/thing', ''])('returns undefined for %j', (uri) => {
    expect(findProviderForUri(uri)).toBeUndefined();
  });
});
