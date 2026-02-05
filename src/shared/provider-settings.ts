/**
 * Provider-specific settings schemas for the Runware MCP server.
 *
 * Each provider (model vendor) may support unique parameters that
 * control generation behavior. These schemas validate provider-specific
 * settings before sending them to the API.
 */

import { z } from 'zod';

// ============================================================================
// Alibaba (Wan) Settings
// ============================================================================

/**
 * Settings for Alibaba/Wan video models.
 *
 * Alibaba's Wan models support prompt enhancement, shot composition control,
 * and native audio generation.
 */
export const alibabaSettingsSchema = z.object({
  /**
   * Enable LLM-based prompt rewriting for enhanced results.
   * The prompt will be expanded with additional details.
   */
  promptExtend: z.boolean().optional(),

  /**
   * Shot composition type.
   * - single: Single continuous shot
   * - multi: Multiple shot composition
   */
  shotType: z.enum(['single', 'multi']).optional(),

  /**
   * Enable native audio generation for the video.
   */
  audio: z.boolean().optional(),
});

export type AlibabaSettings = z.infer<typeof alibabaSettingsSchema>;

// ============================================================================
// BFL (Black Forest Labs) Settings
// ============================================================================

/**
 * Settings for Black Forest Labs (BFL) image models.
 *
 * BFL models like FLUX support prompt upsampling, safety controls,
 * and raw output mode.
 */
export const bflSettingsSchema = z.object({
  /**
   * Enable automatic prompt enhancement.
   * When true, the prompt is enriched for better results.
   * Default: false
   */
  promptUpsampling: z.boolean().optional(),

  /**
   * Content moderation strictness level.
   * 0 = strictest, 6 = most permissive
   * Default: 2
   */
  safetyTolerance: z
    .number()
    .int('safetyTolerance must be an integer')
    .min(0, 'safetyTolerance minimum is 0')
    .max(6, 'safetyTolerance maximum is 6')
    .optional(),

  /**
   * Enable raw output mode with minimal post-processing.
   * Produces less polished but more authentic results.
   * Default: false
   */
  raw: z.boolean().optional(),
});

export type BFLSettings = z.infer<typeof bflSettingsSchema>;

// ============================================================================
// Bria Settings
// ============================================================================

/**
 * Settings for Bria image models.
 *
 * Bria offers prompt enhancement, medium selection, image enhancement,
 * content moderation, and generation mode options.
 */
export const briaSettingsSchema = z.object({
  /**
   * Enable prompt enhancement for more descriptive variations.
   * Default: false
   */
  promptEnhancement: z.boolean().optional(),

  /**
   * Output medium type.
   * - photography: Photorealistic output
   * - art: Artistic/illustrative output
   */
  medium: z.enum(['photography', 'art']).optional(),

  /**
   * Enable image enhancement for richer details.
   * Default: false
   */
  enhanceImage: z.boolean().optional(),

  /**
   * Enable content moderation safety standards.
   * Default: true
   */
  contentModeration: z.boolean().optional(),

  /**
   * Generation mode.
   * - base: Standard generation
   * - high_control: Higher control over output
   * - fast: Faster generation with potentially lower quality
   */
  mode: z.enum(['base', 'high_control', 'fast']).optional(),
});

export type BriaSettings = z.infer<typeof briaSettingsSchema>;

// ============================================================================
// Ideogram Settings
// ============================================================================

/**
 * Ideogram style types.
 * Over 65 artistic style options are available.
 */
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

/**
 * Settings for Ideogram image models.
 *
 * Ideogram supports rendering speed control, magic prompt enhancement,
 * extensive style options, and color palette customization.
 */
export const ideogramSettingsSchema = z.object({
  /**
   * Rendering speed/quality tradeoff.
   * - TURBO: Fastest, lower quality
   * - DEFAULT: Balanced
   * - QUALITY: Slowest, highest quality
   */
  renderingSpeed: z.enum(['TURBO', 'DEFAULT', 'QUALITY']).optional(),

  /**
   * Magic prompt enhancement mode.
   * - AUTO: Automatically decide whether to enhance
   * - ON: Always enhance the prompt
   * - OFF: Never enhance the prompt
   */
  magicPrompt: z.enum(['AUTO', 'ON', 'OFF']).optional(),

  /**
   * Artistic style type.
   * Over 65 style options available.
   */
  styleType: z.string().optional(),

  /**
   * Specific style preset name.
   * Fine-grained control over artistic style.
   */
  stylePreset: z.string().optional(),

  /**
   * Color palette for the generation.
   * Can be a preset name (string) or array of hex colors.
   */
  colorPalette: z
    .union([
      z.string(),
      z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')),
    ])
    .optional(),
});

export type IdeogramSettings = z.infer<typeof ideogramSettingsSchema>;

// ============================================================================
// ByteDance Settings
// ============================================================================

/**
 * Settings for ByteDance image models.
 *
 * ByteDance models support sequential image generation for narratives
 * and prompt optimization modes.
 */
export const byteDanceSettingsSchema = z.object({
  /**
   * Maximum number of sequential images for narrative generation.
   * Creates a series of related images.
   * Range: 1-15
   */
  maxSequentialImages: z
    .number()
    .int('maxSequentialImages must be an integer')
    .min(1, 'maxSequentialImages minimum is 1')
    .max(15, 'maxSequentialImages maximum is 15')
    .optional(),

  /**
   * Prompt optimization mode.
   * - standard: Full optimization
   * - fast: Faster but less thorough optimization
   */
  optimizePromptMode: z.enum(['standard', 'fast']).optional(),
});

export type ByteDanceSettings = z.infer<typeof byteDanceSettingsSchema>;

// ============================================================================
// KlingAI Settings
// ============================================================================

/**
 * Settings for KlingAI video models.
 *
 * KlingAI supports native audio generation, original audio preservation,
 * and camera position control.
 */
export const klingAISettingsSchema = z.object({
  /**
   * Enable native audio generation for the video.
   */
  sound: z.boolean().optional(),

  /**
   * Keep original audio from input video (for video-to-video).
   */
  keepOriginalSound: z.boolean().optional(),

  /**
   * Lock camera position during generation.
   * Prevents camera movement in the output.
   */
  cameraFixed: z.boolean().optional(),
});

export type KlingAISettings = z.infer<typeof klingAISettingsSchema>;

// ============================================================================
// PixVerse Settings
// ============================================================================

/**
 * PixVerse viral effects.
 * 20 unique effects for creative video generation.
 */
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

/**
 * PixVerse camera movements.
 * 21 camera movement options for cinematic control.
 */
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

/**
 * Settings for PixVerse video models.
 *
 * PixVerse supports 20 viral effects, 21 camera movements,
 * and multi-clip cinematic generation.
 */
export const pixVerseSettingsSchema = z.object({
  /**
   * Viral effect to apply.
   * Choose from 20 unique effects.
   */
  effect: z.string().optional(),

  /**
   * Camera movement type.
   * Choose from 21 camera movement options.
   */
  cameraMovement: z.string().optional(),

  /**
   * Enable multi-clip cinematic generation.
   * Creates multiple connected shots.
   */
  multiClip: z.boolean().optional(),
});

export type PixVerseSettings = z.infer<typeof pixVerseSettingsSchema>;

// ============================================================================
// Veo (Google) Settings
// ============================================================================

/**
 * Settings for Google Veo video models.
 *
 * Veo supports prompt enhancement (always on for Veo 3)
 * and audio generation (Veo 3 only).
 */
export const veoSettingsSchema = z.object({
  /**
   * Enable automatic prompt enhancement.
   * Always enabled for Veo 3.
   */
  enhancePrompt: z.boolean().optional(),

  /**
   * Generate audio for the video.
   * Only available for Veo 3.
   */
  generateAudio: z.boolean().optional(),
});

export type VeoSettings = z.infer<typeof veoSettingsSchema>;

// ============================================================================
// Sync.so Settings
// ============================================================================

/**
 * Audio segment for Sync.so multi-audio editing.
 */
export const audioSegmentSchema = z.object({
  /**
   * Start time in seconds.
   */
  start: z.number().min(0, 'Audio segment start must be >= 0'),

  /**
   * End time in seconds.
   */
  end: z.number().min(0, 'Audio segment end must be >= 0'),

  /**
   * Audio source (URL or UUID).
   */
  audio: z.string().min(1, 'Audio segment audio source is required'),
});

export type AudioSegment = z.infer<typeof audioSegmentSchema>;

/**
 * Settings for Sync.so lip-sync video models.
 *
 * Sync.so specializes in lip-sync synchronization with audio,
 * supporting speaker detection, occlusion handling, and segment-based editing.
 */
export const syncSettingsSchema = z.object({
  /**
   * Enable automatic speaker detection.
   * Helps identify and track speakers in the video.
   */
  speakerDetection: z.boolean().optional(),

  /**
   * Enable occlusion handling.
   * Improves lip-sync when face is partially occluded.
   */
  occlusionHandling: z.boolean().optional(),

  /**
   * Audio segments for multi-audio editing.
   * Allows different audio tracks for different time ranges.
   */
  audioSegments: z.array(audioSegmentSchema).optional(),
});

export type SyncSettings = z.infer<typeof syncSettingsSchema>;

// ============================================================================
// Combined Provider Settings Schema
// ============================================================================

/**
 * Combined schema for all provider settings.
 *
 * Only one provider's settings should be specified at a time,
 * matching the model being used.
 */
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

// ============================================================================
// Provider Detection
// ============================================================================

/**
 * Known provider prefixes in AIR model identifiers.
 */
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

/**
 * Provider names.
 */
export type ProviderName = keyof typeof PROVIDER_PREFIXES;

/**
 * Detects the provider from a model identifier.
 *
 * @param model - AIR model identifier (e.g., "bfl:flux1-dev@1")
 * @returns The detected provider name, or undefined if not recognized
 */
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

/**
 * Validates provider settings match the detected provider.
 *
 * @param model - AIR model identifier
 * @param settings - Provider settings object
 * @returns True if settings match the provider or no provider-specific settings are provided
 */
export function validateProviderSettingsMatch(
  model: string,
  settings: ProviderSettingsInput | undefined,
): boolean {
  if (settings === undefined) {
    return true;
  }

  const detectedProvider = detectProvider(model);

  // If we can't detect the provider, allow any settings
  if (detectedProvider === undefined) {
    return true;
  }

  // Check if only the matching provider's settings are specified
  // Get all keys that have a defined value
  const specifiedProviders = Object.keys(settings).filter((key) => {
    const value = settings[key as keyof ProviderSettingsInput];
    return value !== undefined;
  });

  if (specifiedProviders.length === 0) {
    return true;
  }

  // Allow if the detected provider is among the specified ones
  return specifiedProviders.includes(detectedProvider);
}
