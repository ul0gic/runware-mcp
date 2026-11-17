// Does:  Declares per-provider settings schemas and detects a model's provider from its AIR prefix.
// Holds: detectProvider matches AIR prefixes case-insensitively and returns undefined, never a guess, when none match.

import { z } from 'zod';

export const alibabaSettingsSchema = z.object({
  promptExtend: z.boolean().optional(),

  shotType: z.enum(['single', 'multi']).optional(),

  audio: z.boolean().optional(),
});

export const bflSettingsSchema = z.object({
  promptUpsampling: z.boolean().optional(),

  // Holds: 0 is the strictest moderation and 6 the most permissive.
  safetyTolerance: z
    .number()
    .int('safetyTolerance must be an integer')
    .min(0, 'safetyTolerance minimum is 0')
    .max(6, 'safetyTolerance maximum is 6')
    .optional(),

  raw: z.boolean().optional(),
});

const briaSettingsSchema = z.object({
  promptEnhancement: z.boolean().optional(),

  medium: z.enum(['photography', 'art']).optional(),

  enhanceImage: z.boolean().optional(),

  contentModeration: z.boolean().optional(),

  mode: z.enum(['base', 'high_control', 'fast']).optional(),
});

export const ideogramSettingsSchema = z.object({
  renderingSpeed: z.enum(['TURBO', 'DEFAULT', 'QUALITY']).optional(),

  magicPrompt: z.enum(['AUTO', 'ON', 'OFF']).optional(),

  styleType: z.string().optional(),

  stylePreset: z.string().optional(),

  colorPalette: z
    .union([z.string(), z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'))])
    .optional(),
});

export const byteDanceSettingsSchema = z.object({
  maxSequentialImages: z
    .number()
    .int('maxSequentialImages must be an integer')
    .min(1, 'maxSequentialImages minimum is 1')
    .max(15, 'maxSequentialImages maximum is 15')
    .optional(),

  optimizePromptMode: z.enum(['standard', 'fast']).optional(),
});

export const klingAISettingsSchema = z.object({
  sound: z.boolean().optional(),

  keepOriginalSound: z.boolean().optional(),

  cameraFixed: z.boolean().optional(),
});

export const pixVerseSettingsSchema = z.object({
  effect: z.string().optional(),

  cameraMovement: z.string().optional(),

  multiClip: z.boolean().optional(),
});

export const veoSettingsSchema = z.object({
  enhancePrompt: z.boolean().optional(),

  generateAudio: z.boolean().optional(),
});

const audioSegmentSchema = z.object({
  start: z.number().min(0, 'Audio segment start must be >= 0'),
  end: z.number().min(0, 'Audio segment end must be >= 0'),
  audio: z.string().min(1, 'Audio segment audio source is required'),
});

export const syncSettingsSchema = z.object({
  speakerDetection: z.boolean().optional(),

  occlusionHandling: z.boolean().optional(),

  audioSegments: z.array(audioSegmentSchema).optional(),
});

export const providerSettingsSchema = z.object({
  alibaba: alibabaSettingsSchema.optional(),
  bfl: bflSettingsSchema.optional(),
  bria: briaSettingsSchema.optional(),
  ideogram: ideogramSettingsSchema.optional(),
  byteDance: byteDanceSettingsSchema.optional(),
  klingai: klingAISettingsSchema.optional(),
  pixverse: pixVerseSettingsSchema.optional(),
  veo: veoSettingsSchema.optional(),
  sync: syncSettingsSchema.optional(),
});

const PROVIDER_PREFIXES = {
  alibaba: ['alibaba:', 'wan:'],
  bfl: ['bfl:', 'flux:'],
  bria: ['bria:'],
  ideogram: ['ideogram:'],
  byteDance: ['bytedance:', 'doubao:'],
  klingai: ['klingai:', 'kling:'],
  pixverse: ['pixverse:'],
  veo: ['veo:', 'google:'],
  sync: ['sync:', 'syncso:'],
} as const;

export type ProviderName = keyof typeof PROVIDER_PREFIXES;

function isProviderName(value: string): value is ProviderName {
  return Object.hasOwn(PROVIDER_PREFIXES, value);
}

export function detectProvider(model: string): ProviderName | undefined {
  const lowerModel = model.toLowerCase();

  return Object.keys(PROVIDER_PREFIXES)
    .filter(isProviderName)
    .find((provider) => PROVIDER_PREFIXES[provider].some((prefix) => lowerModel.startsWith(prefix)));
}
