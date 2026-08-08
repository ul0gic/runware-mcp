import { z } from 'zod';

/** Alibaba/Wan models support prompt enhancement, shot composition control, and native audio generation. */
export const alibabaSettingsSchema = z.object({
  /** Enable LLM-based prompt rewriting; the prompt is expanded with additional detail. */
  promptExtend: z.boolean().optional(),

  /** single: one continuous shot. multi: multiple shot composition. */
  shotType: z.enum(['single', 'multi']).optional(),

  audio: z.boolean().optional(),
});

export type AlibabaSettings = z.infer<typeof alibabaSettingsSchema>;

/** Black Forest Labs (FLUX) models support prompt upsampling, safety controls, and raw output mode. */
export const bflSettingsSchema = z.object({
  /** Enrich the prompt for better results. Default: false. */
  promptUpsampling: z.boolean().optional(),

  /** Content moderation strictness: 0 = strictest, 6 = most permissive. Default: 2. */
  safetyTolerance: z
    .number()
    .int('safetyTolerance must be an integer')
    .min(0, 'safetyTolerance minimum is 0')
    .max(6, 'safetyTolerance maximum is 6')
    .optional(),

  /** Minimal post-processing: less polished but more authentic. Default: false. */
  raw: z.boolean().optional(),
});

export type BFLSettings = z.infer<typeof bflSettingsSchema>;

/** Bria models support prompt enhancement, medium selection, image enhancement, content moderation, and generation mode. */
export const briaSettingsSchema = z.object({
  /** Default: false. */
  promptEnhancement: z.boolean().optional(),

  /** photography: photorealistic. art: artistic/illustrative. */
  medium: z.enum(['photography', 'art']).optional(),

  /** Default: false. */
  enhanceImage: z.boolean().optional(),

  /** Default: true. */
  contentModeration: z.boolean().optional(),

  /** base: standard. high_control: more control over output. fast: quicker, potentially lower quality. */
  mode: z.enum(['base', 'high_control', 'fast']).optional(),
});

export type BriaSettings = z.infer<typeof briaSettingsSchema>;

/** Over 65 artistic style options are available; this is a non-exhaustive sample. */
export const IDEOGRAM_STYLE_TYPES = [
  'AUTO',
  'GENERAL',
  'REALISTIC',
  'DESIGN',
  'FICTION',
  'ANIME',
  '3D_RENDERING',
  'CINEMATIC',
  'FASHION',
  'FOOD',
  'INTERIOR',
  'ARCHITECTURE',
] as const;

/** Ideogram supports rendering speed control, magic prompt enhancement, extensive style options, and color palette customization. */
export const ideogramSettingsSchema = z.object({
  /** TURBO: fastest, lower quality. DEFAULT: balanced. QUALITY: slowest, highest quality. */
  renderingSpeed: z.enum(['TURBO', 'DEFAULT', 'QUALITY']).optional(),

  /** AUTO: decide automatically. ON: always enhance. OFF: never enhance. */
  magicPrompt: z.enum(['AUTO', 'ON', 'OFF']).optional(),

  styleType: z.string().optional(),

  stylePreset: z.string().optional(),

  /** Preset name, or an array of hex colors. */
  colorPalette: z
    .union([
      z.string(),
      z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')),
    ])
    .optional(),
});

export type IdeogramSettings = z.infer<typeof ideogramSettingsSchema>;

/** ByteDance models support sequential image generation for narratives and prompt optimization modes. */
export const byteDanceSettingsSchema = z.object({
  /** Creates a series of related images. Range: 1-15. */
  maxSequentialImages: z
    .number()
    .int('maxSequentialImages must be an integer')
    .min(1, 'maxSequentialImages minimum is 1')
    .max(15, 'maxSequentialImages maximum is 15')
    .optional(),

  /** standard: full optimization. fast: quicker, less thorough. */
  optimizePromptMode: z.enum(['standard', 'fast']).optional(),
});

export type ByteDanceSettings = z.infer<typeof byteDanceSettingsSchema>;

/** KlingAI supports native audio generation, original audio preservation, and camera position control. */
export const klingAISettingsSchema = z.object({
  sound: z.boolean().optional(),

  /** Keep original audio from the input video (video-to-video only). */
  keepOriginalSound: z.boolean().optional(),

  /** Prevents camera movement in the output. */
  cameraFixed: z.boolean().optional(),
});

export type KlingAISettings = z.infer<typeof klingAISettingsSchema>;

/** 20 unique effects for creative video generation. */
export const PIXVERSE_EFFECTS = [
  'jiggle',
  'inflate',
  'melt',
  'explode',
  'squish',
  'transform',
  'dance',
  'swim',
  'fly',
  'grow',
  'shrink',
  'bounce',
  'spin',
  'wave',
  'pulse',
  'shake',
  'twist',
  'morph',
  'dissolve',
  'emerge',
] as const;

/** 21 camera movement options for cinematic control. */
export const PIXVERSE_CAMERA_MOVEMENTS = [
  'zoom_in',
  'zoom_out',
  'pan_left',
  'pan_right',
  'pan_up',
  'pan_down',
  'dolly_in',
  'dolly_out',
  'dolly_left',
  'dolly_right',
  'tilt_up',
  'tilt_down',
  'orbit_left',
  'orbit_right',
  'crane_up',
  'crane_down',
  'track_left',
  'track_right',
  'push_in',
  'pull_out',
  'static',
] as const;

/** PixVerse supports viral effects, camera movements, and multi-clip cinematic generation. */
export const pixVerseSettingsSchema = z.object({
  /** One of PIXVERSE_EFFECTS. */
  effect: z.string().optional(),

  /** One of PIXVERSE_CAMERA_MOVEMENTS. */
  cameraMovement: z.string().optional(),

  /** Creates multiple connected shots. */
  multiClip: z.boolean().optional(),
});

export type PixVerseSettings = z.infer<typeof pixVerseSettingsSchema>;

/** Veo supports prompt enhancement (always on for Veo 3) and audio generation (Veo 3 only). */
export const veoSettingsSchema = z.object({
  /** Always enabled for Veo 3. */
  enhancePrompt: z.boolean().optional(),

  /** Veo 3 only. */
  generateAudio: z.boolean().optional(),
});

export type VeoSettings = z.infer<typeof veoSettingsSchema>;

export const audioSegmentSchema = z.object({
  start: z.number().min(0, 'Audio segment start must be >= 0'),
  end: z.number().min(0, 'Audio segment end must be >= 0'),
  audio: z.string().min(1, 'Audio segment audio source is required'),
});

export type AudioSegment = z.infer<typeof audioSegmentSchema>;

/** Sync.so specializes in lip-sync with audio, supporting speaker detection, occlusion handling, and segment-based editing. */
export const syncSettingsSchema = z.object({
  speakerDetection: z.boolean().optional(),

  /** Improves lip-sync when the face is partially occluded. */
  occlusionHandling: z.boolean().optional(),

  /** Different audio tracks for different time ranges. */
  audioSegments: z.array(audioSegmentSchema).optional(),
});

export type SyncSettings = z.infer<typeof syncSettingsSchema>;

/** Only one provider's settings should be specified at a time, matching the model being used. */
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

export type ProviderSettingsInput = z.infer<typeof providerSettingsSchema>;

export const PROVIDER_PREFIXES = {
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

export function detectProvider(model: string): ProviderName | undefined {
  const lowerModel = model.toLowerCase();

  for (const [provider, prefixes] of Object.entries(PROVIDER_PREFIXES)) {
    for (const prefix of prefixes) {
      if (lowerModel.startsWith(prefix)) {
        return provider as ProviderName;
      }
    }
  }

  return undefined;
}

export function validateProviderSettingsMatch(
  model: string,
  settings: ProviderSettingsInput | undefined,
): boolean {
  if (settings === undefined) {
    return true;
  }

  const detectedProvider = detectProvider(model);

  if (detectedProvider === undefined) {
    return true;
  }

  const specifiedProviders = Object.keys(settings).filter((key) => {
    const value = settings[key as keyof ProviderSettingsInput];
    return value !== undefined;
  });

  if (specifiedProviders.length === 0) {
    return true;
  }

  return specifiedProviders.includes(detectedProvider);
}
