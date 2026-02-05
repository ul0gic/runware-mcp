import { describe, it, expect } from 'vitest';

import {
  detectProvider,
  providerSettingsSchema,
  validateProviderSettingsMatch,
  alibabaSettingsSchema,
  bflSettingsSchema,
  briaSettingsSchema,
  ideogramSettingsSchema,
  byteDanceSettingsSchema,
  klingAISettingsSchema,
  pixVerseSettingsSchema,
  veoSettingsSchema,
  syncSettingsSchema,
  PROVIDER_PREFIXES,
} from '../../../src/shared/provider-settings.js';

// ============================================================================
// detectProvider
// ============================================================================

describe('detectProvider', () => {
  it('detects alibaba from alibaba: prefix', () => {
    expect(detectProvider('alibaba:123@456')).toBe('alibaba');
  });

  it('detects alibaba from wan: prefix', () => {
    expect(detectProvider('wan:123@456')).toBe('alibaba');
  });

  it('detects bfl from bfl: prefix', () => {
    expect(detectProvider('bfl:123@456')).toBe('bfl');
  });

  it('detects bfl from flux: prefix', () => {
    expect(detectProvider('flux:123@456')).toBe('bfl');
  });

  it('detects bria from bria: prefix', () => {
    expect(detectProvider('bria:123@456')).toBe('bria');
  });

  it('detects ideogram from ideogram: prefix', () => {
    expect(detectProvider('ideogram:123@456')).toBe('ideogram');
  });

  it('detects byteDance from bytedance: prefix', () => {
    expect(detectProvider('bytedance:123@456')).toBe('byteDance');
  });

  it('detects byteDance from doubao: prefix', () => {
    expect(detectProvider('doubao:123@456')).toBe('byteDance');
  });

  it('detects klingai from klingai: prefix', () => {
    expect(detectProvider('klingai:123@456')).toBe('klingai');
  });

  it('detects klingai from kling: prefix', () => {
    expect(detectProvider('kling:123@456')).toBe('klingai');
  });

  it('detects pixverse from pixverse: prefix', () => {
    expect(detectProvider('pixverse:123@456')).toBe('pixverse');
  });

  it('detects veo from veo: prefix', () => {
    expect(detectProvider('veo:123@456')).toBe('veo');
  });

  it('detects veo from google: prefix', () => {
    expect(detectProvider('google:123@456')).toBe('veo');
  });

  it('detects sync from sync: prefix', () => {
    expect(detectProvider('sync:123@456')).toBe('sync');
  });

  it('detects sync from syncso: prefix', () => {
    expect(detectProvider('syncso:123@456')).toBe('sync');
  });

  it('returns undefined for unknown model', () => {
    expect(detectProvider('unknown:123@456')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(detectProvider('')).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(detectProvider('BFL:123@456')).toBe('bfl');
    expect(detectProvider('BRIA:123@456')).toBe('bria');
    expect(detectProvider('Ideogram:123@456')).toBe('ideogram');
  });
});

// ============================================================================
// providerSettingsSchema
// ============================================================================

describe('providerSettingsSchema', () => {
  it('accepts empty object', () => {
    const result = providerSettingsSchema.parse({});
    expect(result).toBeDefined();
  });

  it('accepts alibaba settings', () => {
    const result = providerSettingsSchema.parse({
      alibaba: { promptExtend: true, shotType: 'multi' },
    });
    expect(result.alibaba?.promptExtend).toBe(true);
    expect(result.alibaba?.shotType).toBe('multi');
  });

  it('accepts bfl settings', () => {
    const result = providerSettingsSchema.parse({
      bfl: { promptUpsampling: true, safetyTolerance: 3, raw: false },
    });
    expect(result.bfl?.safetyTolerance).toBe(3);
  });

  it('accepts bria settings', () => {
    const result = providerSettingsSchema.parse({
      bria: { medium: 'photography', mode: 'fast' },
    });
    expect(result.bria?.medium).toBe('photography');
  });

  it('accepts ideogram settings', () => {
    const result = providerSettingsSchema.parse({
      ideogram: {
        renderingSpeed: 'QUALITY',
        magicPrompt: 'ON',
        colorPalette: ['#FF0000', '#00FF00'],
      },
    });
    expect(result.ideogram?.renderingSpeed).toBe('QUALITY');
  });

  it('accepts multiple provider settings simultaneously', () => {
    const result = providerSettingsSchema.parse({
      bfl: { raw: true },
      ideogram: { magicPrompt: 'OFF' },
    });
    expect(result.bfl?.raw).toBe(true);
    expect(result.ideogram?.magicPrompt).toBe('OFF');
  });

  it('rejects invalid bfl safetyTolerance', () => {
    expect(() =>
      providerSettingsSchema.parse({
        bfl: { safetyTolerance: 10 },
      }),
    ).toThrow();
  });

  it('rejects invalid bria medium', () => {
    expect(() =>
      providerSettingsSchema.parse({
        bria: { medium: 'invalid' },
      }),
    ).toThrow();
  });
});

// ============================================================================
// Individual Provider Settings Schemas
// ============================================================================

describe('alibabaSettingsSchema', () => {
  it('accepts valid settings', () => {
    const result = alibabaSettingsSchema.parse({
      promptExtend: true,
      shotType: 'single',
      audio: false,
    });
    expect(result.promptExtend).toBe(true);
  });

  it('accepts empty object', () => {
    const result = alibabaSettingsSchema.parse({});
    expect(result).toBeDefined();
  });
});

describe('bflSettingsSchema', () => {
  it('validates safetyTolerance range 0-6', () => {
    expect(() => bflSettingsSchema.parse({ safetyTolerance: -1 })).toThrow();
    expect(() => bflSettingsSchema.parse({ safetyTolerance: 7 })).toThrow();
    expect(bflSettingsSchema.parse({ safetyTolerance: 0 }).safetyTolerance).toBe(0);
    expect(bflSettingsSchema.parse({ safetyTolerance: 6 }).safetyTolerance).toBe(6);
  });
});

describe('byteDanceSettingsSchema', () => {
  it('validates maxSequentialImages range 1-15', () => {
    expect(() => byteDanceSettingsSchema.parse({ maxSequentialImages: 0 })).toThrow();
    expect(() => byteDanceSettingsSchema.parse({ maxSequentialImages: 16 })).toThrow();
    expect(byteDanceSettingsSchema.parse({ maxSequentialImages: 1 }).maxSequentialImages).toBe(1);
    expect(byteDanceSettingsSchema.parse({ maxSequentialImages: 15 }).maxSequentialImages).toBe(15);
  });
});

describe('ideogramSettingsSchema', () => {
  it('accepts string colorPalette', () => {
    const result = ideogramSettingsSchema.parse({ colorPalette: 'warm' });
    expect(result.colorPalette).toBe('warm');
  });

  it('accepts array of hex colors', () => {
    const result = ideogramSettingsSchema.parse({ colorPalette: ['#FF0000', '#00FF00'] });
    expect(result.colorPalette).toEqual(['#FF0000', '#00FF00']);
  });

  it('rejects invalid hex colors in array', () => {
    expect(() =>
      ideogramSettingsSchema.parse({ colorPalette: ['not-a-hex'] }),
    ).toThrow();
  });
});

describe('klingAISettingsSchema', () => {
  it('accepts valid settings', () => {
    const result = klingAISettingsSchema.parse({
      sound: true,
      keepOriginalSound: false,
      cameraFixed: true,
    });
    expect(result.sound).toBe(true);
  });
});

describe('pixVerseSettingsSchema', () => {
  it('accepts valid settings', () => {
    const result = pixVerseSettingsSchema.parse({
      effect: 'jiggle',
      cameraMovement: 'zoom_in',
      multiClip: true,
    });
    expect(result.effect).toBe('jiggle');
  });
});

describe('veoSettingsSchema', () => {
  it('accepts valid settings', () => {
    const result = veoSettingsSchema.parse({
      enhancePrompt: true,
      generateAudio: false,
    });
    expect(result.enhancePrompt).toBe(true);
  });
});

describe('syncSettingsSchema', () => {
  it('accepts valid settings with audio segments', () => {
    const result = syncSettingsSchema.parse({
      speakerDetection: true,
      audioSegments: [
        { start: 0, end: 5, audio: 'https://example.com/audio.mp3' },
      ],
    });
    expect(result.audioSegments).toHaveLength(1);
  });

  it('rejects invalid audio segment (negative start)', () => {
    expect(() =>
      syncSettingsSchema.parse({
        audioSegments: [{ start: -1, end: 5, audio: 'test' }],
      }),
    ).toThrow();
  });

  it('rejects audio segment with empty audio string', () => {
    expect(() =>
      syncSettingsSchema.parse({
        audioSegments: [{ start: 0, end: 5, audio: '' }],
      }),
    ).toThrow();
  });
});

// ============================================================================
// validateProviderSettingsMatch
// ============================================================================

describe('validateProviderSettingsMatch', () => {
  it('returns true when settings are undefined', () => {
    expect(validateProviderSettingsMatch('bfl:123@456', undefined)).toBe(true);
  });

  it('returns true when settings are empty', () => {
    expect(validateProviderSettingsMatch('bfl:123@456', {})).toBe(true);
  });

  it('returns true when settings match detected provider', () => {
    expect(
      validateProviderSettingsMatch('bfl:123@456', {
        bfl: { raw: true },
      }),
    ).toBe(true);
  });

  it('returns false when settings do not match detected provider', () => {
    expect(
      validateProviderSettingsMatch('bfl:123@456', {
        bria: { medium: 'photography' },
      }),
    ).toBe(false);
  });

  it('returns true when provider cannot be detected (allows any)', () => {
    expect(
      validateProviderSettingsMatch('unknown:123@456', {
        bfl: { raw: true },
      }),
    ).toBe(true);
  });
});

// ============================================================================
// PROVIDER_PREFIXES
// ============================================================================

describe('PROVIDER_PREFIXES', () => {
  it('has entries for all expected providers', () => {
    expect(PROVIDER_PREFIXES.alibaba).toBeDefined();
    expect(PROVIDER_PREFIXES.bfl).toBeDefined();
    expect(PROVIDER_PREFIXES.bria).toBeDefined();
    expect(PROVIDER_PREFIXES.ideogram).toBeDefined();
    expect(PROVIDER_PREFIXES.byteDance).toBeDefined();
    expect(PROVIDER_PREFIXES.klingai).toBeDefined();
    expect(PROVIDER_PREFIXES.pixverse).toBeDefined();
    expect(PROVIDER_PREFIXES.veo).toBeDefined();
    expect(PROVIDER_PREFIXES.sync).toBeDefined();
  });
});
