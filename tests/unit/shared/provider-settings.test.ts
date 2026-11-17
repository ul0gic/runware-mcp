// Does:  Proves model-id prefixes map to providers and provider settings enforce their numeric and format bounds.
// Holds: Exercises the real detector and zod schemas; nothing is mocked.

import { describe, expect, it } from 'vitest';

import {
  bflSettingsSchema,
  byteDanceSettingsSchema,
  detectProvider,
  ideogramSettingsSchema,
  providerSettingsSchema,
  syncSettingsSchema,
} from '../../../src/shared/provider-settings.js';

describe('detectProvider', () => {
  it.each([
    ['alibaba:123@456', 'alibaba'],
    ['wan:123@456', 'alibaba'],
    ['bfl:123@456', 'bfl'],
    ['flux:123@456', 'bfl'],
    ['bria:123@456', 'bria'],
    ['ideogram:123@456', 'ideogram'],
    ['bytedance:123@456', 'byteDance'],
    ['doubao:123@456', 'byteDance'],
    ['klingai:123@456', 'klingai'],
    ['kling:123@456', 'klingai'],
    ['pixverse:123@456', 'pixverse'],
    ['veo:123@456', 'veo'],
    ['google:123@456', 'veo'],
    ['sync:123@456', 'sync'],
    ['syncso:123@456', 'sync'],
  ])('maps %s to %s', (model, provider) => {
    expect(detectProvider(model)).toBe(provider);
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

describe('providerSettingsSchema', () => {
  it('rejects invalid bfl safetyTolerance', () => {
    expect(() =>
      providerSettingsSchema.parse({
        bfl: { safetyTolerance: 10 },
      }),
    ).toThrow();
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
  it('rejects invalid hex colors in array', () => {
    expect(() => ideogramSettingsSchema.parse({ colorPalette: ['not-a-hex'] })).toThrow();
  });
});

describe('syncSettingsSchema', () => {
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
