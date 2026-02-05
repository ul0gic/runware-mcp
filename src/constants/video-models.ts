/**
 * Video Models Constants
 *
 * Complete catalog of all video generation models supported by Runware API.
 * Models use AIR (AI Resource) identifiers in the format: provider:version@variant
 *
 * @remarks
 * The object keys use the AIR format which contains colons and at-signs.
 * This is intentional as it matches the Runware API model identifiers.
 */

// =============================================================================
// Feature Constants (to avoid duplicate string literals)
// =============================================================================

const FEATURE_TEXT_TO_VIDEO = 'text-to-video';
const FEATURE_IMAGE_TO_VIDEO = 'image-to-video';
const FEATURE_VIDEO_TO_VIDEO = 'video-to-video';
const FEATURE_NATIVE_AUDIO = 'native-audio';
const FEATURE_EXTENDED_DURATION = 'extended-duration';
const FEATURE_1080P = '1080p';
const FEATURE_CAMERA_CONTROL = 'camera-control';
const FEATURE_HIGH_QUALITY = 'high-quality';
const FEATURE_IMPROVED_MOTION = 'improved-motion';
const FEATURE_PROMPT_ENHANCEMENT = 'prompt-enhancement';
const FEATURE_PROMPT_EXTEND = 'prompt-extend';
const FEATURE_SHOT_TYPES = 'shot-types';
const FEATURE_VIRAL_EFFECTS = 'viral-effects';
const FEATURE_CAMERA_MOVEMENTS = 'camera-movements';
const FEATURE_MULTI_CLIP = 'multi-clip';
const FEATURE_CHARACTER_CONSISTENCY = 'character-consistency';
const FEATURE_CINEMATIC_QUALITY = 'cinematic-quality';
const FEATURE_FAST_GENERATION = 'fast-generation';
const FEATURE_DANCE_GENERATION = 'dance-generation';
const FEATURE_LIP_SYNC = 'lip-sync';
const FEATURE_AUDIO_DRIVEN = 'audio-driven';
const FEATURE_SPEAKER_DETECTION = 'speaker-detection';
const FEATURE_OCCLUSION_HANDLING = 'occlusion-handling';
const FEATURE_SEGMENT_EDITING = 'segment-editing';
const FEATURE_LONG_FORM = 'long-form';

/**
 * Video model definition with provider-specific capabilities
 */
export interface VideoModel {
  /** AIR identifier (e.g., 'klingai:1@1') */
  readonly id: string;
  /** Human-readable display name */
  readonly name: string;
  /** Provider name */
  readonly provider: VideoProvider;
  /** Maximum output width in pixels */
  readonly maxWidth: number;
  /** Maximum output height in pixels */
  readonly maxHeight: number;
  /** Minimum video duration in seconds */
  readonly minDuration: number;
  /** Maximum video duration in seconds */
  readonly maxDuration: number;
  /** Whether model supports custom FPS settings */
  readonly supportsFPS: boolean;
  /** Default frames per second (if applicable) */
  readonly defaultFPS?: number;
  /** Whether model can generate audio */
  readonly supportsAudio: boolean;
  /** Whether model accepts image input (image-to-video) */
  readonly supportsImageInput: boolean;
  /** Whether model accepts video input (video-to-video) */
  readonly supportsVideoInput: boolean;
  /** Special features supported by this model */
  readonly features: readonly string[];
  /** Estimated cost per second of generated video (USD) */
  readonly costPerSecond?: number;
  /** Additional model-specific notes */
  readonly notes?: string;
}

/**
 * Video provider identifiers
 */
export type VideoProvider =
  | 'klingai'
  | 'google'
  | 'minimax'
  | 'pixverse'
  | 'vidu'
  | 'alibaba'
  | 'runway'
  | 'seedance'
  | 'sync';

/**
 * Complete catalog of video generation models
 *
 * Keys use AIR format (provider:version@variant) which is required by the Runware API.
 */
export const VIDEO_MODELS = {
  // =============================================================================
  // KlingAI Models (10 models)
  // =============================================================================

  'klingai:1@1': {
    id: 'klingai:1@1',
    name: 'Kling 1.0 Standard',
    provider: 'klingai',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 5,
    maxDuration: 5,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO],
    costPerSecond: 0.02,
  },

  'klingai:1@2': {
    id: 'klingai:1@2',
    name: 'Kling 1.0 Pro',
    provider: 'klingai',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_EXTENDED_DURATION],
    costPerSecond: 0.04,
  },

  'klingai:1.5@1': {
    id: 'klingai:1.5@1',
    name: 'Kling 1.5 Standard',
    provider: 'klingai',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 5,
    maxDuration: 5,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_NATIVE_AUDIO],
    costPerSecond: 0.03,
  },

  'klingai:1.5@2': {
    id: 'klingai:1.5@2',
    name: 'Kling 1.5 Pro',
    provider: 'klingai',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_NATIVE_AUDIO,
      FEATURE_EXTENDED_DURATION,
    ],
    costPerSecond: 0.05,
  },

  'klingai:1.6@1': {
    id: 'klingai:1.6@1',
    name: 'Kling 1.6 Standard',
    provider: 'klingai',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 5,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_NATIVE_AUDIO, FEATURE_1080P],
    costPerSecond: 0.04,
  },

  'klingai:1.6@2': {
    id: 'klingai:1.6@2',
    name: 'Kling 1.6 Pro',
    provider: 'klingai',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_NATIVE_AUDIO,
      FEATURE_1080P,
      FEATURE_EXTENDED_DURATION,
    ],
    costPerSecond: 0.06,
  },

  'klingai:2@1': {
    id: 'klingai:2@1',
    name: 'Kling 2.0 Master',
    provider: 'klingai',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: true,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_VIDEO_TO_VIDEO,
      FEATURE_NATIVE_AUDIO,
      FEATURE_1080P,
      FEATURE_CAMERA_CONTROL,
    ],
    costPerSecond: 0.08,
    notes: 'Latest flagship model with camera control and video-to-video support',
  },

  'klingai:2@2': {
    id: 'klingai:2@2',
    name: 'Kling 2.0 Master Pro',
    provider: 'klingai',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 30,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: true,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_VIDEO_TO_VIDEO,
      FEATURE_NATIVE_AUDIO,
      FEATURE_1080P,
      FEATURE_CAMERA_CONTROL,
      FEATURE_HIGH_QUALITY,
    ],
    costPerSecond: 0.1,
    notes: 'Premium quality variant of Kling 2.0',
  },

  'klingai:2.1@1': {
    id: 'klingai:2.1@1',
    name: 'Kling 2.1 Standard',
    provider: 'klingai',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: true,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_VIDEO_TO_VIDEO,
      FEATURE_NATIVE_AUDIO,
      FEATURE_1080P,
      FEATURE_IMPROVED_MOTION,
    ],
    costPerSecond: 0.07,
  },

  'klingai:2.1@2': {
    id: 'klingai:2.1@2',
    name: 'Kling 2.1 Pro',
    provider: 'klingai',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 30,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: true,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_VIDEO_TO_VIDEO,
      FEATURE_NATIVE_AUDIO,
      FEATURE_1080P,
      FEATURE_IMPROVED_MOTION,
      FEATURE_EXTENDED_DURATION,
    ],
    costPerSecond: 0.09,
  },

  // =============================================================================
  // Google Veo Models (3 models)
  // =============================================================================

  'veo:2@1': {
    id: 'veo:2@1',
    name: 'Veo 2',
    provider: 'google',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 8,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_1080P, FEATURE_PROMPT_ENHANCEMENT],
    costPerSecond: 0.05,
    notes: 'Google Veo 2 with optional prompt enhancement',
  },

  'veo:2@2': {
    id: 'veo:2@2',
    name: 'Veo 2 HD',
    provider: 'google',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 8,
    supportsFPS: true,
    defaultFPS: 30,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_1080P,
      FEATURE_PROMPT_ENHANCEMENT,
      FEATURE_HIGH_QUALITY,
    ],
    costPerSecond: 0.07,
    notes: 'Higher quality variant of Veo 2',
  },

  'veo:3@1': {
    id: 'veo:3@1',
    name: 'Veo 3',
    provider: 'google',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 8,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_1080P,
      FEATURE_NATIVE_AUDIO,
      'prompt-enhancement-always',
    ],
    costPerSecond: 0.1,
    notes: 'Latest Veo with native audio generation (prompt enhancement always enabled)',
  },

  // =============================================================================
  // MiniMax Models (4 models)
  // =============================================================================

  'minimax:1@1': {
    id: 'minimax:1@1',
    name: 'MiniMax Video-01',
    provider: 'minimax',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 5,
    maxDuration: 6,
    supportsFPS: false,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO],
    costPerSecond: 0.025,
  },

  'minimax:1@2': {
    id: 'minimax:1@2',
    name: 'MiniMax Video-01 HD',
    provider: 'minimax',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 6,
    supportsFPS: false,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_1080P],
    costPerSecond: 0.04,
  },

  'minimax:2@1': {
    id: 'minimax:2@1',
    name: 'MiniMax Video-02',
    provider: 'minimax',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 5,
    maxDuration: 6,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, 'improved-quality'],
    costPerSecond: 0.035,
  },

  'minimax:2@2': {
    id: 'minimax:2@2',
    name: 'MiniMax Video-02 HD',
    provider: 'minimax',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 6,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_1080P, 'improved-quality'],
    costPerSecond: 0.05,
  },

  // =============================================================================
  // PixVerse Models (3 models)
  // =============================================================================

  'pixverse:3@1': {
    id: 'pixverse:3@1',
    name: 'PixVerse 3.0',
    provider: 'pixverse',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 4,
    maxDuration: 8,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_VIRAL_EFFECTS, FEATURE_CAMERA_MOVEMENTS],
    costPerSecond: 0.03,
    notes: 'Supports 20 viral effects and 21 camera movements',
  },

  'pixverse:3.5@1': {
    id: 'pixverse:3.5@1',
    name: 'PixVerse 3.5',
    provider: 'pixverse',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 4,
    maxDuration: 8,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_VIRAL_EFFECTS,
      FEATURE_CAMERA_MOVEMENTS,
      FEATURE_1080P,
      FEATURE_MULTI_CLIP,
    ],
    costPerSecond: 0.04,
    notes: 'Enhanced version with 1080p and multi-clip support',
  },

  'pixverse:4@1': {
    id: 'pixverse:4@1',
    name: 'PixVerse 4.0',
    provider: 'pixverse',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 4,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 30,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: true,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_VIDEO_TO_VIDEO,
      FEATURE_VIRAL_EFFECTS,
      FEATURE_CAMERA_MOVEMENTS,
      FEATURE_1080P,
      FEATURE_MULTI_CLIP,
      FEATURE_EXTENDED_DURATION,
    ],
    costPerSecond: 0.06,
    notes: 'Latest PixVerse with video-to-video support',
  },

  // =============================================================================
  // Vidu Models (4 models)
  // =============================================================================

  'vidu:1@1': {
    id: 'vidu:1@1',
    name: 'Vidu 1.0',
    provider: 'vidu',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 4,
    maxDuration: 8,
    supportsFPS: false,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO],
    costPerSecond: 0.025,
  },

  'vidu:1.5@1': {
    id: 'vidu:1.5@1',
    name: 'Vidu 1.5',
    provider: 'vidu',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 4,
    maxDuration: 8,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_IMPROVED_MOTION],
    costPerSecond: 0.03,
  },

  'vidu:2@1': {
    id: 'vidu:2@1',
    name: 'Vidu 2.0',
    provider: 'vidu',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 4,
    maxDuration: 8,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_1080P, FEATURE_CHARACTER_CONSISTENCY],
    costPerSecond: 0.04,
    notes: 'Improved character and scene consistency',
  },

  'vidu:2@2': {
    id: 'vidu:2@2',
    name: 'Vidu 2.0 Pro',
    provider: 'vidu',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 4,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 30,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: true,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_VIDEO_TO_VIDEO,
      FEATURE_1080P,
      FEATURE_CHARACTER_CONSISTENCY,
      FEATURE_EXTENDED_DURATION,
    ],
    costPerSecond: 0.06,
  },

  // =============================================================================
  // Wan/Alibaba Models (2 models)
  // =============================================================================

  'wan:1@1': {
    id: 'wan:1@1',
    name: 'Wan 2.1',
    provider: 'alibaba',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 5,
    maxDuration: 5,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_NATIVE_AUDIO,
      FEATURE_PROMPT_EXTEND,
      FEATURE_SHOT_TYPES,
    ],
    costPerSecond: 0.03,
    notes: 'Supports prompt extension and single/multi-shot composition',
  },

  'wan:1@2': {
    id: 'wan:1@2',
    name: 'Wan 2.1 Pro',
    provider: 'alibaba',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_NATIVE_AUDIO,
      FEATURE_PROMPT_EXTEND,
      FEATURE_SHOT_TYPES,
      FEATURE_1080P,
      FEATURE_EXTENDED_DURATION,
    ],
    costPerSecond: 0.05,
  },

  // =============================================================================
  // Runway Models (2 models)
  // =============================================================================

  'runway:3@1': {
    id: 'runway:3@1',
    name: 'Runway Gen-3 Alpha',
    provider: 'runway',
    maxWidth: 1280,
    maxHeight: 768,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_CINEMATIC_QUALITY],
    costPerSecond: 0.05,
    notes: 'Cinematic quality generation',
  },

  'runway:3@2': {
    id: 'runway:3@2',
    name: 'Runway Gen-3 Alpha Turbo',
    provider: 'runway',
    maxWidth: 1280,
    maxHeight: 768,
    minDuration: 5,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_FAST_GENERATION],
    costPerSecond: 0.025,
    notes: 'Faster generation with slightly reduced quality',
  },

  // =============================================================================
  // Seedance Models (2 models)
  // =============================================================================

  'seedance:1@1': {
    id: 'seedance:1@1',
    name: 'Seedance 1.0',
    provider: 'seedance',
    maxWidth: 1280,
    maxHeight: 720,
    minDuration: 4,
    maxDuration: 8,
    supportsFPS: true,
    defaultFPS: 24,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [FEATURE_TEXT_TO_VIDEO, FEATURE_IMAGE_TO_VIDEO, FEATURE_DANCE_GENERATION],
    costPerSecond: 0.03,
    notes: 'Specialized for dance and motion generation',
  },

  'seedance:1@2': {
    id: 'seedance:1@2',
    name: 'Seedance 1.0 Pro',
    provider: 'seedance',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 4,
    maxDuration: 10,
    supportsFPS: true,
    defaultFPS: 30,
    supportsAudio: false,
    supportsImageInput: true,
    supportsVideoInput: false,
    features: [
      FEATURE_TEXT_TO_VIDEO,
      FEATURE_IMAGE_TO_VIDEO,
      FEATURE_DANCE_GENERATION,
      FEATURE_1080P,
      FEATURE_EXTENDED_DURATION,
    ],
    costPerSecond: 0.05,
  },

  // =============================================================================
  // Sync.so Models (Lip Sync - 1 model)
  // =============================================================================

  'sync:1.9.1@1': {
    id: 'sync:1.9.1@1',
    name: 'Sync 1.9.1 Lipsync',
    provider: 'sync',
    maxWidth: 1920,
    maxHeight: 1080,
    minDuration: 1,
    maxDuration: 60,
    supportsFPS: true,
    defaultFPS: 30,
    supportsAudio: true,
    supportsImageInput: true,
    supportsVideoInput: true,
    features: [
      FEATURE_LIP_SYNC,
      FEATURE_AUDIO_DRIVEN,
      FEATURE_SPEAKER_DETECTION,
      FEATURE_OCCLUSION_HANDLING,
      FEATURE_SEGMENT_EDITING,
      FEATURE_1080P,
      FEATURE_LONG_FORM,
    ],
    costPerSecond: 0.02,
    notes: 'Professional lip-sync with speaker detection and occlusion handling',
  },
} as const satisfies Record<string, VideoModel>;

/**
 * Type for valid video model IDs
 */
export type VideoModelId = keyof typeof VIDEO_MODELS;

/**
 * Get a video model by its AIR identifier
 */
export function getVideoModel(modelId: string): VideoModel | undefined {
  if (isValidVideoModel(modelId)) {
    return VIDEO_MODELS[modelId];
  }
  return undefined;
}

/**
 * Get all video models from a specific provider
 */
export function getVideoModelsByProvider(provider: VideoProvider): VideoModel[] {
  return Object.values(VIDEO_MODELS).filter((model) => model.provider === provider);
}

/**
 * Get all unique video provider names
 */
export function getAllVideoProviders(): VideoProvider[] {
  const providers = new Set(Object.values(VIDEO_MODELS).map((model) => model.provider));
  return [...providers];
}

/**
 * Get the default video model (Kling 1.5 Pro - good balance of quality and features)
 */
export function getDefaultVideoModel(): VideoModel {
  return VIDEO_MODELS['klingai:1.5@2'];
}

/**
 * Get video models that support a specific feature
 */
export function getVideoModelsByFeature(feature: string): VideoModel[] {
  return Object.values(VIDEO_MODELS).filter((model: VideoModel) =>
    (model.features).includes(feature),
  );
}

/**
 * Get video models that support audio generation
 */
export function getVideoModelsWithAudio(): VideoModel[] {
  return Object.values(VIDEO_MODELS).filter((model) => model.supportsAudio);
}

/**
 * Get video models that support the specified minimum duration
 */
export function getVideoModelsByMinDuration(minDurationSeconds: number): VideoModel[] {
  return Object.values(VIDEO_MODELS).filter((model) => model.maxDuration >= minDurationSeconds);
}

/**
 * Get video models that support the specified resolution
 */
export function getVideoModelsByResolution(width: number, height: number): VideoModel[] {
  return Object.values(VIDEO_MODELS).filter(
    (model) => model.maxWidth >= width && model.maxHeight >= height,
  );
}

/**
 * Check if a model ID is a valid video model
 */
export function isValidVideoModel(modelId: string): modelId is VideoModelId {
  return modelId in VIDEO_MODELS;
}

/**
 * Get all video model IDs
 */
export function getAllVideoModelIds(): VideoModelId[] {
  return Object.keys(VIDEO_MODELS) as VideoModelId[];
}
